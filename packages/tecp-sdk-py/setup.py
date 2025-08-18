#!/usr/bin/env python3
"""
TECP SDK for Python
Setup configuration for the Trusted Ephemeral Computation Protocol Python SDK
"""

from setuptools import setup, find_packages
import os

# Read README for long description
def read_readme():
    readme_path = os.path.join(os.path.dirname(__file__), 'README.md')
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "TECP SDK for Python - Create and verify ephemeral computation receipts"

setup(
    name="tecp-sdk",
    version="0.1.0",
    description="TECP SDK for Python - Create and verify ephemeral computation receipts",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    author="TECP Protocol Contributors",
    author_email="contributors@tecp.dev",
    url="https://github.com/tecp-protocol/tecp",
    project_urls={
        "Documentation": "https://tecp.dev/docs",
        "Source": "https://github.com/tecp-protocol/tecp",
        "Tracker": "https://github.com/tecp-protocol/tecp/issues",
    },
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "cryptography>=41.0.0",
        "cbor2>=5.4.0",
        "requests>=2.31.0",
        "pydantic>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "types-requests>=2.31.0",
        ],
        "async": [
            "aiohttp>=3.8.0",
            "asyncio>=3.4.3",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Security :: Cryptography",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: System :: Distributed Computing",
    ],
    keywords=[
        "tecp",
        "ephemeral-computation",
        "privacy",
        "cryptographic-receipts",
        "zero-trust",
        "compliance",
        "gdpr",
        "hipaa",
    ],
    license="Apache-2.0",
    zip_safe=False,
    include_package_data=True,
    entry_points={
        "console_scripts": [
            "tecp-verify=tecp_sdk.cli:verify_command",
            "tecp-create=tecp_sdk.cli:create_command",
        ],
    },
)
