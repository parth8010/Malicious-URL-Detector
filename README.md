# Malicious-URL-Detector
Malicious URL Detector Browser Extension

A comprehensive browser extension that detects malicious URLs in real-time using Machine Learning, Google Safe Browsing, VirusTotal, and WHOIS analysis.

------------------------------------------------------------------------------------------------------------------

## Overview

This project provides a complete solution for URL security analysis, featuring:

- A Machine Learning model with 86% accuracy for URL classification
- Real-time browser extension for Chrome/Edge
- RESTful API for programmatic URL analysis
- Integration with multiple security services

-------------------------------------------------------------------------------------------------------------------
## Features

### Core Detection
- **Machine Learning Model**: Random Forest classifier trained on 24,800 samples
- **Real-time Analysis**: Instant URL scanning during browsing
- **Multiple Detection Engines**:
  - ML-based pattern recognition (9 features)
  - Google Safe Browsing API integration
  - VirusTotal multi-engine scanning
  - WHOIS domain reputation analysis

### Browser Extension
- Real-time security alerts for malicious websites
- Detailed scan reports with confidence scores
- Scan history with timestamp tracking
- One-click scanning of current pages
- Intuitive user interface

### Backend API
- Flask-based REST API with CORS support
- Health monitoring endpoints
- Comprehensive JSON responses
- Rate limiting and input validation

----------------------------------------------------------------------------------------------------------------------------------

## Technical Specifications

### Model Performance
- **Accuracy**: 86%
- **Weighted F1 Score**: 86%
- **Training Samples**: 24,800
- **Features**: 9 URL characteristics
- **Classes**: benign, defacement, malware, phishing

### Technologies Used
- **Backend**: Python, Flask, scikit-learn
- **Frontend**: HTML, CSS, JavaScript
- **Machine Learning**: Random Forest, pandas, numpy
- **APIs**: Google Safe Browsing, VirusTotal, WHOIS
- **Browser**: Chrome Extension Manifest V3

------------------------------------------------------------------------------------------------------------------------------
## Installation

### Prerequisites
- Python 3.8 or higher
- Chrome or Edge browser
- (Optional) API keys for enhanced detection




