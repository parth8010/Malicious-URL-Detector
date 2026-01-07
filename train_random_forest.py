import pandas as pd
import numpy as np
from urllib.parse import urlparse
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
from imblearn.over_sampling import SMOTE

def load_data(file_path):
    df = pd.read_csv(file_path)
    return df

def extract_features(url):
    parsed_url = urlparse(url)
    subdomain_count = parsed_url.netloc.count('.')
    special_char_count = sum(1 for c in url if not c.isalnum())
    url_length = len(url)
    domain_length = len(parsed_url.netloc)
    return [url_length, special_char_count, subdomain_count, domain_length]

def prepare_data(df):
    df['features'] = df['url'].apply(extract_features)
    X = np.vstack(df['features'].values)
    
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(df['type'])

    return X, y, label_encoder

def train_model(X_train, y_train):
    model = RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42)
    model.fit(X_train, y_train)
    return model

if __name__ == "__main__":
    file_path = 'malicious_phish.csv' 
    df = load_data(file_path)
    X, y, label_encoder = prepare_data(df)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    smote = SMOTE(sampling_strategy='auto', random_state=42)
    X_train_sm, y_train_sm = smote.fit_resample(X_train, y_train)

    print("Class distribution after SMOTE:")
    print(pd.Series(y_train_sm).value_counts())

    model = train_model(X_train_sm, y_train_sm)

    joblib.dump(model, 'random_forest_model.pkl')
    joblib.dump(label_encoder, 'label_encoder.pkl')

    print("Random Forest Model and Label Encoder Saved!")

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    conf_matrix = confusion_matrix(y_test, y_pred)
    class_report = classification_report(y_test, y_pred)

    print(f"Accuracy: {accuracy:.2f}")
    print("Confusion Matrix:\n", conf_matrix)
    print("Classification Report:\n", class_report)
