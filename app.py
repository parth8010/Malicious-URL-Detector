from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import urlparse
import joblib
import numpy as np
import whois
from datetime import datetime
import requests
import json
import time

app = Flask(__name__)
CORS(app)

GOOGLE_SAFE_BROWSING_API_KEY = "ADD your API key"
VIRUSTOTAL_API_KEY = "ADD your API key "

model = None
label_encoder = None
feature_extractor = None
metrics = {"accuracy": 0.0, "classes": [], "feature_count": 0, "samples": 0}

try:
    model = joblib.load("random_forest_model.pkl")
    label_encoder = joblib.load("label_encoder.pkl")
    feature_extractor = joblib.load("feature_extractor.pkl")
    
    with open('model_metrics.json', 'r') as f:
        metrics = json.load(f)
    
    print(" Model loaded successfully")
    print(f"   Accuracy: {metrics.get('accuracy', 0)*100:.1f}%")
    print(f"   Classes: {metrics.get('classes', [])}")
    
except Exception as e:
    print(f"  Model loading warning: {e}")
    print("   Running without ML model")

def extract_features(url):
    """Extract features using the saved extractor"""
    if feature_extractor:
        return feature_extractor(url)
    else:
        # Fallback feature extraction
        parsed_url = urlparse(url if url.startswith("http") else "http://" + url)
        return [
            len(url),
            len(parsed_url.netloc),
            max(0, parsed_url.netloc.count('.') - 1),
            sum(1 for c in url if not c.isalnum() and c not in ['.', '-', '_', '/', ':']),
            len(parsed_url.path),
            parsed_url.query.count('&') + 1 if parsed_url.query else 0,
            1 if url.startswith('https') else 0,
            1 if '@' in parsed_url.netloc else 0,
            sum(1 for c in parsed_url.netloc if c.isdigit())
        ]

def get_whois_info(url):
    """Get WHOIS information for domain"""
    try:
        parsed_url = urlparse(url if url.startswith("http") else "http://" + url)
        domain = parsed_url.netloc
        
        if domain.startswith('www.'):
            domain = domain[4:]
        
        domain_info = whois.whois(domain)
        
        creation_date = domain_info.creation_date
        expiry_date = domain_info.expiration_date
        
        if isinstance(creation_date, list):
            creation_date = creation_date[0] if creation_date else None
        if isinstance(expiry_date, list):
            expiry_date = expiry_date[0] if expiry_date else None
        
        domain_age = -1
        days_until_expiry = -1
        
        if creation_date:
            if isinstance(creation_date, str):
                try:
                    creation_date = datetime.strptime(creation_date.split()[0], "%Y-%m-%d")
                except:
                    creation_date = None
            if creation_date:
                domain_age = (datetime.now() - creation_date).days
        
        if expiry_date:
            if isinstance(expiry_date, str):
                try:
                    expiry_date = datetime.strptime(expiry_date.split()[0], "%Y-%m-%d")
                except:
                    expiry_date = None
            if expiry_date:
                days_until_expiry = (expiry_date - datetime.now()).days
        
        privacy_protection = "Enabled" if not domain_info.get("registrar") else "Not Enabled"
        
        return {
            "domain_age": domain_age,
            "days_until_expiry": days_until_expiry,
            "privacy_protection": privacy_protection,
            "registrar": str(domain_info.get("registrar", "Unknown"))
        }
    except Exception as e:
        return {
            "domain_age": -1,
            "days_until_expiry": -1,
            "privacy_protection": "Unknown",
            "registrar": "Unknown"
        }

def predict_based_on_whois(whois_info):
    """Predict based on WHOIS heuristics"""
    if whois_info["domain_age"] == -1:
        return "unknown"
    
    domain_age = whois_info["domain_age"]
    days_until_expiry = whois_info["days_until_expiry"]
    
    if domain_age < 30:
        return "malicious"
    elif days_until_expiry < 7:
        return "malicious"
    elif whois_info["privacy_protection"] == "Enabled":
        return "malicious"
    else:
        return "benign"

def check_safe_browsing(url):
    """Check URL with Google Safe Browsing API"""
    try:
        if not GOOGLE_SAFE_BROWSING_API_KEY:
            return "benign"
        
        api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_API_KEY}"
        
        payload = {
            "client": {
                "clientId": "url-malware-detector",
                "clientVersion": "1.0.0"
            },
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }
        
        headers = {'Content-Type': 'application/json'}
        response = requests.post(api_url, json=payload, headers=headers, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            if 'matches' in result and result['matches']:
                return "malicious"
            else:
                return "benign"
        else:
            return "error"
            
    except Exception as e:
        return "error"

def check_virustotal(url):
    """Check URL with VirusTotal API"""
    try:
        if not VIRUSTOTAL_API_KEY:
            return "benign"
        
        headers = {
            "x-apikey": VIRUSTOTAL_API_KEY,
            "accept": "application/json"
        }
        
        # Submit URL for analysis
        submit_url = "https://www.virustotal.com/api/v3/urls"
        submit_data = {"url": url}
        
        submit_response = requests.post(submit_url, headers=headers, data=submit_data, timeout=10)
        
        if submit_response.status_code == 200:
            analysis_id = submit_response.json()['data']['id']
            
            # Get analysis results
            analysis_url = f"https://www.virustotal.com/api/v3/analyses/{analysis_id}"
            analysis_response = requests.get(analysis_url, headers=headers, timeout=10)
            
            if analysis_response.status_code == 200:
                result = analysis_response.json()
                stats = result['data']['attributes']['stats']
                
                malicious_count = stats.get('malicious', 0)
                
                if malicious_count > 0:
                    return "malicious"
                else:
                    return "benign"
            else:
                return "error"
        else:
            return "error"
            
    except Exception as e:
        return "error"

def determine_final_class(model_pred, vt_result, gsb_result, whois_pred, confidence):
    """Weighted decision based on all checks"""
    # Convert model prediction to malicious/benign
    if model_pred in ["phishing", "malware", "defacement"]:
        model_vote = "malicious"
    elif model_pred == "benign":
        model_vote = "benign"
    else:
        model_vote = "suspicious"
    
    votes = {
        "model": model_vote,
        "virustotal": vt_result,
        "safebrowsing": gsb_result,
        "whois": whois_pred
    }
    
    malicious_count = sum(1 for v in votes.values() if v == "malicious")
    benign_count = sum(1 for v in votes.values() if v == "benign")
    
    if malicious_count >= 2:
        return "malicious"
    elif benign_count >= 2:
        return "benign"
    else:
        return "suspicious"

@app.route("/")
def home():
    return """
    <h1>URL Malware Detection API</h1>
    <p>Use: GET /analyze?url=YOUR_URL</p>
    <p>Example: <a href="/analyze?url=https://google.com">/analyze?url=https://google.com</a></p>
    """

@app.route("/analyze", methods=["GET"])
def analyze_url():
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "URL parameter is required"}), 400

    try:
        # 1. Model Prediction
        features = extract_features(url)
        features_np = np.array(features).reshape(1, -1)
        
        if model is None or label_encoder is None:
            prediction_label = "unknown"
            confidence = 0
            probabilities = {}
        else:
            prediction_index = model.predict(features_np)[0]
            prediction_label = label_encoder.inverse_transform([prediction_index])[0]
            
            # Get probabilities
            proba = model.predict_proba(features_np)[0]
            confidence = float(proba[prediction_index] * 100)
            
            # Create probability dictionary
            probabilities = {}
            for i, cls in enumerate(label_encoder.classes_):
                probabilities[cls] = float(proba[i] * 100)

        # 2. WHOIS info & heuristic
        whois_info = get_whois_info(url)
        whois_pred = predict_based_on_whois(whois_info)

        # 3. Safe Browsing and VirusTotal
        safebrowsing = check_safe_browsing(url)
        virustotal = check_virustotal(url)

        # 4. Map model prediction
        model_decision = "benign"
        if prediction_label in ["phishing", "malware", "defacement"]:
            model_decision = "malicious"
        elif prediction_label == "benign":
            model_decision = "benign"
        else:
            model_decision = "suspicious"

        # 5. Final result
        majority_vote = determine_final_class(
            model_decision,
            virustotal,
            safebrowsing,
            whois_pred,
            confidence
        )

        # Prepare response
        response = {
            "url": url,
            "model": {
                "prediction": prediction_label,
                "confidence": confidence,
                "probabilities": probabilities,
                "accuracy": metrics.get("accuracy", 0) * 100
            },
            "external_checks": {
                "google_safe_browsing": safebrowsing,
                "virus_total": virustotal,
                "whois_analysis": whois_pred
            },
            "whois_details": whois_info,
            "final_verdict": majority_vote,
            "status": "success",
            "timestamp": datetime.now().isoformat()
        }
        
        print(f" Analysis complete for: {url}")
        print(f"   Final Verdict: {majority_vote}")
        
        return jsonify(response)
        
    except Exception as e:
        print(f" Error analyzing URL {url}: {e}")
        return jsonify({
            "error": str(e),
            "url": url,
            "status": "error"
        }), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_accuracy": metrics.get("accuracy", 0) * 100,
        "apis_configured": {
            "google_safe_browsing": bool(GOOGLE_SAFE_BROWSING_API_KEY),
            "virus_total": bool(VIRUSTOTAL_API_KEY)
        }
    })

if __name__ == "__main__":
    print(" Starting Flask API server...")
    print(" Endpoints:")
    print("   GET /analyze?url=YOUR_URL")
    print("   GET /health")
    app.run(debug=True, host='0.0.0.0', port=5000)