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

-------------------------------------------------------------------------------------------------------------------------------

## Screen shots

### Testing Using Safe URL


- Step 1
<img width="1017" height="731" alt="image" src="https://github.com/user-attachments/assets/1a5f9d6a-e4f3-4928-8cee-9cf4d7ba0787" />


- Step 2
<img width="1051" height="754" alt="image" src="https://github.com/user-attachments/assets/5dc8f202-b14a-476d-a1ea-eaecfb4e891f" />


- Step 3
<img width="1068" height="776" alt="image" src="https://github.com/user-attachments/assets/d288ac4c-daeb-42b1-939f-9283ad551848" />


------------------------------------------------------------------------------------------------------------------------------------



### Testing Using Malicious URL



- Step 1
<img width="1063" height="775" alt="image" src="https://github.com/user-attachments/assets/1601ec7d-2e57-48cf-ad99-4352c2f909f9" />


- Step 2
<img width="1069" height="770" alt="image" src="https://github.com/user-attachments/assets/b2caacf8-ad95-4a87-8e7f-9e39d6d659a9" />


- Step 3
<img width="1062" height="780" alt="image" src="https://github.com/user-attachments/assets/b3368787-cda9-441e-9e8d-36ad58187a07" />
