// Package tecp provides a Go SDK for the Trusted Ephemeral Computation Protocol.
//
// The TECP SDK allows you to create and verify cryptographic receipts for
// ephemeral computation, providing evidence of data processing without retention.
//
// Example usage:
//
//	import "github.com/tecp-protocol/tecp-sdk-go/tecp"
//
//	// Generate a key pair
//	privateKey, publicKey, err := tecp.GenerateKeyPair()
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Create a client
//	client := tecp.NewClient(tecp.ClientOptions{
//		PrivateKey: privateKey,
//		Profile:    tecp.ProfileV01,
//	})
//
//	// Create a receipt
//	receipt, err := client.CreateReceipt(tecp.CreateReceiptOptions{
//		Input:    []byte("sensitive data"),
//		Output:   []byte("processed result"),
//		Policies: []string{"no_retention", "eu_region"},
//		CodeRef:  "git:abc123def456",
//	})
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Verify the receipt
//	result, err := client.VerifyReceipt(receipt, tecp.VerifyOptions{})
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	fmt.Printf("Receipt valid: %v\n", result.Valid)
package tecp

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/fxamacker/cbor/v2"
)

// Profile represents a TECP profile level
type Profile string

const (
	ProfileLite   Profile = "tecp-lite"
	ProfileV01    Profile = "tecp-v0.1"
	ProfileStrict Profile = "tecp-strict"
)

// Client provides methods for creating and verifying TECP receipts
type Client struct {
	privateKey ed25519.PrivateKey
	profile    Profile
	logURL     string
	options    ClientOptions
}

// ClientOptions configures a TECP client
type ClientOptions struct {
	PrivateKey ed25519.PrivateKey
	Profile    Profile
	LogURL     string
}

// Receipt represents a TECP receipt
type Receipt struct {
	Version    string            `json:"version" cbor:"version"`
	CodeRef    string            `json:"code_ref" cbor:"code_ref"`
	Timestamp  int64             `json:"ts" cbor:"ts"`
	Nonce      string            `json:"nonce" cbor:"nonce"`
	InputHash  string            `json:"input_hash" cbor:"input_hash"`
	OutputHash string            `json:"output_hash" cbor:"output_hash"`
	PolicyIDs  []string          `json:"policy_ids" cbor:"policy_ids"`
	Signature  string            `json:"sig" cbor:"sig"`
	PublicKey  string            `json:"pubkey" cbor:"pubkey"`
	Extensions map[string]interface{} `json:",inline" cbor:",inline"`
}

// CreateReceiptOptions configures receipt creation
type CreateReceiptOptions struct {
	Input      []byte
	Output     []byte
	Policies   []string
	CodeRef    string
	Extensions map[string]interface{}
}

// VerificationResult contains the result of receipt verification
type VerificationResult struct {
	Valid      bool     `json:"valid"`
	Errors     []string `json:"errors"`
	Warnings   []string `json:"warnings,omitempty"`
	Profile    Profile  `json:"profile,omitempty"`
	ErrorCodes []string `json:"error_codes,omitempty"`
}

// VerifyOptions configures receipt verification
type VerifyOptions struct {
	RequireLog bool
	Profile    Profile
	LogURL     string
}

// Constants
const (
	TECPVersion        = "TECP-0.1"
	MaxReceiptAgeMS    = 24 * 60 * 60 * 1000 // 24 hours
	MaxClockSkewMS     = 5 * 60 * 1000        // 5 minutes
	MaxReceiptSizeKB   = 8
	NonceSize          = 16
)

// NewClient creates a new TECP client
func NewClient(options ClientOptions) *Client {
	profile := options.Profile
	if profile == "" {
		profile = ProfileV01
	}

	return &Client{
		privateKey: options.PrivateKey,
		profile:    profile,
		logURL:     options.LogURL,
		options:    options,
	}
}

// CreateReceipt creates a new TECP receipt for ephemeral computation
func (c *Client) CreateReceipt(options CreateReceiptOptions) (*Receipt, error) {
	if c.privateKey == nil {
		return nil, fmt.Errorf("private key required for receipt creation")
	}

	// Generate receipt fields
	timestamp := time.Now().UnixMilli()
	nonce := make([]byte, NonceSize)
	if _, err := rand.Read(nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	inputHash := sha256.Sum256(options.Input)
	outputHash := sha256.Sum256(options.Output)

	// Create core receipt data
	codeRef := options.CodeRef
	if codeRef == "" {
		codeRef = fmt.Sprintf("go-sdk:%d", timestamp)
	}

	policies := options.Policies
	if policies == nil {
		policies = []string{"no_retention"}
	}

	publicKey := c.privateKey.Public().(ed25519.PublicKey)

	receipt := &Receipt{
		Version:    TECPVersion,
		CodeRef:    codeRef,
		Timestamp:  timestamp,
		Nonce:      base64.StdEncoding.EncodeToString(nonce),
		InputHash:  base64.StdEncoding.EncodeToString(inputHash[:]),
		OutputHash: base64.StdEncoding.EncodeToString(outputHash[:]),
		PolicyIDs:  policies,
		PublicKey:  base64.StdEncoding.EncodeToString(publicKey),
		Extensions: make(map[string]interface{}),
	}

	// Add extensions
	if options.Extensions != nil {
		for k, v := range options.Extensions {
			receipt.Extensions[k] = v
		}
	}

	// Add environment metadata
	receipt.Extensions["environment"] = map[string]interface{}{
		"provider": "tecp-sdk-go",
		"version":  "0.1.0",
	}

	// Sign the receipt
	signingData := map[string]interface{}{
		"version":     receipt.Version,
		"code_ref":    receipt.CodeRef,
		"ts":          receipt.Timestamp,
		"nonce":       receipt.Nonce,
		"input_hash":  receipt.InputHash,
		"output_hash": receipt.OutputHash,
		"policy_ids":  receipt.PolicyIDs,
		"pubkey":      receipt.PublicKey,
	}

	canonicalCBOR, err := c.canonicalCBOR(signingData)
	if err != nil {
		return nil, fmt.Errorf("failed to create canonical CBOR: %w", err)
	}

	signature := ed25519.Sign(c.privateKey, canonicalCBOR)
	receipt.Signature = base64.StdEncoding.EncodeToString(signature)

	return receipt, nil
}

// VerifyReceipt verifies a TECP receipt's cryptographic integrity
func (c *Client) VerifyReceipt(receipt *Receipt, options VerifyOptions) (*VerificationResult, error) {
	var errors []string
	var warnings []string

	// Validate basic structure
	if receipt.Version != TECPVersion {
		errors = append(errors, fmt.Sprintf("invalid version: %s", receipt.Version))
	}

	// Validate timestamp
	now := time.Now().UnixMilli()
	age := now - receipt.Timestamp
	skew := receipt.Timestamp - now

	maxAge := int64(MaxReceiptAgeMS)
	maxSkew := int64(MaxClockSkewMS)

	// Adjust limits based on profile
	profile := options.Profile
	if profile == "" {
		profile = c.profile
	}

	switch profile {
	case ProfileLite:
		maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
		maxSkew = 15 * 60 * 1000          // 15 minutes
	case ProfileStrict:
		maxAge = 60 * 60 * 1000 // 1 hour
		maxSkew = 60 * 1000     // 1 minute
	}

	if age > maxAge {
		errors = append(errors, fmt.Sprintf("receipt too old: %dms > %dms", age, maxAge))
	} else if skew > maxSkew {
		errors = append(errors, fmt.Sprintf("receipt timestamp in future: %dms > %dms", skew, maxSkew))
	}

	// Verify signature
	if err := c.verifySignature(receipt); err != nil {
		errors = append(errors, fmt.Sprintf("signature verification failed: %v", err))
	}

	// Validate policies (profile-dependent)
	if profile == ProfileStrict && len(receipt.PolicyIDs) == 0 {
		errors = append(errors, "TECP-STRICT requires at least one policy")
	}

	// TODO: Transparency log verification
	if options.RequireLog {
		warnings = append(warnings, "transparency log verification not yet implemented")
	}

	return &VerificationResult{
		Valid:    len(errors) == 0,
		Errors:   errors,
		Warnings: warnings,
		Profile:  profile,
	}, nil
}

// verifySignature verifies the Ed25519 signature on a receipt
func (c *Client) verifySignature(receipt *Receipt) error {
	// Decode public key
	publicKeyBytes, err := base64.StdEncoding.DecodeString(receipt.PublicKey)
	if err != nil {
		return fmt.Errorf("invalid public key encoding: %w", err)
	}

	if len(publicKeyBytes) != ed25519.PublicKeySize {
		return fmt.Errorf("invalid public key size: %d", len(publicKeyBytes))
	}

	publicKey := ed25519.PublicKey(publicKeyBytes)

	// Decode signature
	signature, err := base64.StdEncoding.DecodeString(receipt.Signature)
	if err != nil {
		return fmt.Errorf("invalid signature encoding: %w", err)
	}

	// Reconstruct signing data
	signingData := map[string]interface{}{
		"version":     receipt.Version,
		"code_ref":    receipt.CodeRef,
		"ts":          receipt.Timestamp,
		"nonce":       receipt.Nonce,
		"input_hash":  receipt.InputHash,
		"output_hash": receipt.OutputHash,
		"policy_ids":  receipt.PolicyIDs,
		"pubkey":      receipt.PublicKey,
	}

	canonicalCBOR, err := c.canonicalCBOR(signingData)
	if err != nil {
		return fmt.Errorf("failed to create canonical CBOR: %w", err)
	}

	// Verify signature
	if !ed25519.Verify(publicKey, canonicalCBOR, signature) {
		return fmt.Errorf("signature verification failed")
	}

	return nil
}

// canonicalCBOR creates canonical CBOR encoding with sorted keys
func (c *Client) canonicalCBOR(data interface{}) ([]byte, error) {
	// Sort keys recursively
	sorted := c.sortKeys(data)

	// Create CBOR encoder with canonical options
	em, err := cbor.CanonicalEncOptions().EncMode()
	if err != nil {
		return nil, err
	}

	return em.Marshal(sorted)
}

// sortKeys recursively sorts map keys for deterministic encoding
func (c *Client) sortKeys(data interface{}) interface{} {
	switch v := data.(type) {
	case map[string]interface{}:
		keys := make([]string, 0, len(v))
		for k := range v {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		result := make(map[string]interface{})
		for _, k := range keys {
			result[k] = c.sortKeys(v[k])
		}
		return result

	case []interface{}:
		result := make([]interface{}, len(v))
		for i, item := range v {
			result[i] = c.sortKeys(item)
		}
		return result

	default:
		return v
	}
}

// ToJSON converts a receipt to JSON
func (r *Receipt) ToJSON() ([]byte, error) {
	return json.Marshal(r)
}

// FromJSON creates a receipt from JSON
func FromJSON(data []byte) (*Receipt, error) {
	var receipt Receipt
	if err := json.Unmarshal(data, &receipt); err != nil {
		return nil, err
	}
	return &receipt, nil
}

// GenerateKeyPair generates a new Ed25519 key pair for TECP
func GenerateKeyPair() (ed25519.PrivateKey, ed25519.PublicKey, error) {
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate key pair: %w", err)
	}
	return privateKey, publicKey, nil
}

// CalculateReceiptSize calculates the size of a receipt in bytes
func CalculateReceiptSize(receipt *Receipt) (int, error) {
	data, err := receipt.ToJSON()
	if err != nil {
		return 0, err
	}
	return len(data), nil
}
