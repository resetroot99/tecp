# TECP SDK for Go

The official Go SDK for the Trusted Ephemeral Computation Protocol (TECP).

## Installation

```bash
go get github.com/tecp-protocol/tecp-sdk-go
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"
    
    "github.com/tecp-protocol/tecp-sdk-go/tecp"
)

func main() {
    // Generate a key pair
    privateKey, publicKey, err := tecp.GenerateKeyPair()
    if err != nil {
        log.Fatal(err)
    }
    
    // Create a client
    client := tecp.NewClient(tecp.ClientOptions{
        PrivateKey: privateKey,
        Profile:    tecp.ProfileV01,
    })
    
    // Create a receipt
    receipt, err := client.CreateReceipt(tecp.CreateReceiptOptions{
        Input:    []byte("sensitive user data"),
        Output:   []byte("processed result"),
        Policies: []string{"no_retention", "eu_region"},
        CodeRef:  "git:abc123def456",
    })
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Receipt created: %s\n", receipt.Version)
    fmt.Printf("Policies: %v\n", receipt.PolicyIDs)
    
    // Verify the receipt
    result, err := client.VerifyReceipt(receipt, tecp.VerifyOptions{})
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Receipt valid: %v\n", result.Valid)
    if !result.Valid {
        fmt.Printf("Errors: %v\n", result.Errors)
    }
}
```

## API Reference

### Client

The main client for creating and verifying TECP receipts.

#### NewClient

```go
client := tecp.NewClient(tecp.ClientOptions{
    PrivateKey: privateKey,
    Profile:    tecp.ProfileV01,
    LogURL:     "https://log.tecp.dev",
})
```

#### CreateReceipt

```go
receipt, err := client.CreateReceipt(tecp.CreateReceiptOptions{
    Input:    []byte("input data"),
    Output:   []byte("output data"),
    Policies: []string{"no_retention", "key_erasure"},
    CodeRef:  "git:commit-hash",
    Extensions: map[string]interface{}{
        "custom": "metadata",
    },
})
```

#### VerifyReceipt

```go
result, err := client.VerifyReceipt(receipt, tecp.VerifyOptions{
    RequireLog: true,
    Profile:    tecp.ProfileStrict,
})
```

### Types

#### Receipt

```go
type Receipt struct {
    Version    string            `json:"version"`
    CodeRef    string            `json:"code_ref"`
    Timestamp  int64             `json:"ts"`
    Nonce      string            `json:"nonce"`
    InputHash  string            `json:"input_hash"`
    OutputHash string            `json:"output_hash"`
    PolicyIDs  []string          `json:"policy_ids"`
    Signature  string            `json:"sig"`
    PublicKey  string            `json:"pubkey"`
    Extensions map[string]interface{} `json:",inline"`
}
```

#### VerificationResult

```go
type VerificationResult struct {
    Valid      bool     `json:"valid"`
    Errors     []string `json:"errors"`
    Warnings   []string `json:"warnings,omitempty"`
    Profile    Profile  `json:"profile,omitempty"`
    ErrorCodes []string `json:"error_codes,omitempty"`
}
```

### Profiles

The SDK supports three TECP profiles:

- `tecp.ProfileLite`: Minimal requirements (7-day validity)
- `tecp.ProfileV01`: Balanced security (24-hour validity) 
- `tecp.ProfileStrict`: Maximum security (1-hour validity)

### Utility Functions

#### GenerateKeyPair

```go
privateKey, publicKey, err := tecp.GenerateKeyPair()
```

#### CalculateReceiptSize

```go
size, err := tecp.CalculateReceiptSize(receipt)
fmt.Printf("Receipt size: %d bytes\n", size)
```

## Examples

### Web Server

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    
    "github.com/tecp-protocol/tecp-sdk-go/tecp"
)

func main() {
    // Initialize client
    privateKey, _, _ := tecp.GenerateKeyPair()
    client := tecp.NewClient(tecp.ClientOptions{
        PrivateKey: privateKey,
        Profile:    tecp.ProfileV01,
    })
    
    http.HandleFunc("/process", func(w http.ResponseWriter, r *http.Request) {
        // Read input
        var input map[string]interface{}
        json.NewDecoder(r.Body).Decode(&input)
        
        // Process data ephemerally
        result := processData(input)
        
        // Create receipt
        receipt, err := client.CreateReceipt(tecp.CreateReceiptOptions{
            Input:    []byte(fmt.Sprintf("%v", input)),
            Output:   []byte(fmt.Sprintf("%v", result)),
            Policies: []string{"no_retention", "eu_region"},
        })
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        
        // Return result with receipt
        response := map[string]interface{}{
            "result":       result,
            "tecp_receipt": receipt,
        }
        
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(response)
    })
    
    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func processData(input map[string]interface{}) map[string]interface{} {
    // Ephemeral data processing
    return map[string]interface{}{
        "processed": true,
        "timestamp": time.Now().Unix(),
    }
}
```

### CLI Tool

```go
package main

import (
    "encoding/json"
    "flag"
    "fmt"
    "io/ioutil"
    "log"
    "os"
    
    "github.com/tecp-protocol/tecp-sdk-go/tecp"
)

func main() {
    var (
        receiptFile = flag.String("receipt", "", "Receipt file to verify")
        verbose     = flag.Bool("verbose", false, "Verbose output")
    )
    flag.Parse()
    
    if *receiptFile == "" {
        log.Fatal("Receipt file required")
    }
    
    // Read receipt
    data, err := ioutil.ReadFile(*receiptFile)
    if err != nil {
        log.Fatal(err)
    }
    
    receipt, err := tecp.FromJSON(data)
    if err != nil {
        log.Fatal(err)
    }
    
    // Verify receipt
    client := tecp.NewClient(tecp.ClientOptions{})
    result, err := client.VerifyReceipt(receipt, tecp.VerifyOptions{})
    if err != nil {
        log.Fatal(err)
    }
    
    // Output results
    if result.Valid {
        fmt.Println("✅ Receipt is valid")
    } else {
        fmt.Println("❌ Receipt is invalid")
        for _, err := range result.Errors {
            fmt.Printf("  Error: %s\n", err)
        }
    }
    
    if *verbose {
        fmt.Printf("Profile: %s\n", result.Profile)
        fmt.Printf("Policies: %v\n", receipt.PolicyIDs)
        fmt.Printf("Timestamp: %d\n", receipt.Timestamp)
    }
}
```

## Error Handling

The SDK returns structured errors for different failure modes:

```go
result, err := client.VerifyReceipt(receipt, options)
if err != nil {
    log.Printf("Verification failed: %v", err)
    return
}

if !result.Valid {
    for _, errMsg := range result.Errors {
        switch {
        case strings.Contains(errMsg, "signature"):
            log.Println("Signature verification failed")
        case strings.Contains(errMsg, "timestamp"):
            log.Println("Timestamp validation failed")
        case strings.Contains(errMsg, "policy"):
            log.Println("Policy validation failed")
        }
    }
}
```

## Testing

```bash
go test ./...
```

## Contributing

See the main [TECP repository](https://github.com/tecp-protocol/tecp) for contribution guidelines.

## License

Apache-2.0 - see [LICENSE](LICENSE) file for details.
