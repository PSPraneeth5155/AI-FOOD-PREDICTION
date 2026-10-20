import os
import json
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, f1_score, classification_report
import onnxmltools
from onnxmltools.convert.common.data_types import FloatTensorType

def generate_balanced_dataset(samples_per_class=2200):
    np.random.seed(42)
    condition_families = [
        'DIABETES', 'PREDIABETES', 'HYPERTENSION', 'HIGH_CHOLESTEROL',
        'HEART_DISEASE', 'OBESITY', 'UNDERWEIGHT', 'CKD',
        'FATTY_LIVER', 'ANEMIA', 'OSTEOPOROSIS', 'ATHLETES',
        'ELDERLY', 'PREGNANCY'
    ]

    target_classes = {0: [], 1: [], 2: [], 3: [], 4: []}

    while any(len(v) < samples_per_class for v in target_classes.values()):
        batch = 3000
        age = np.random.randint(18, 80, batch)
        gender_encoded = np.random.choice([0, 1], batch)
        bmi = np.random.uniform(17.0, 40.0, batch)
        systolic_bp = np.random.randint(105, 175, batch)
        diastolic_bp = np.random.randint(68, 108, batch)
        fasting_glucose = np.random.randint(75, 220, batch)
        hba1c = np.random.uniform(5.0, 10.5, batch)
        egfr = np.random.uniform(20.0, 115.0, batch)
        activity_level_encoded = np.random.randint(1, 5, batch)
        sleep_hours = np.random.uniform(5.0, 9.0, batch)

        cond_dict = {}
        for fam in condition_families:
            has_cond = np.random.binomial(1, 0.20, batch)
            cond_dict[f'fam_{fam}'] = has_cond * np.random.randint(1, 5, batch)

        cond_dict['fam_DIABETES'] = np.where(hba1c >= 7.5, 4, np.where(hba1c >= 6.5, 2, cond_dict['fam_DIABETES']))
        cond_dict['fam_HYPERTENSION'] = np.where(systolic_bp >= 140, 3, np.where(systolic_bp >= 130, 2, cond_dict['fam_HYPERTENSION']))
        cond_dict['fam_CKD'] = np.where(egfr < 30, 4, np.where(egfr < 60, 3, cond_dict['fam_CKD']))
        cond_dict['fam_OBESITY'] = np.where(bmi >= 35, 3, np.where(bmi >= 30, 1, cond_dict['fam_OBESITY']))

        # Food items with varying nutritional profiles
        is_healthy_food = np.random.binomial(1, 0.45, batch)
        calories = np.where(is_healthy_food, np.random.uniform(60, 320, batch), np.random.uniform(250, 750, batch))
        protein = np.where(is_healthy_food, np.random.uniform(8.0, 38.0, batch), np.random.uniform(1.0, 15.0, batch))
        carbs = np.random.uniform(5.0, 85.0, batch)
        fiber = np.where(is_healthy_food, np.random.uniform(4.0, 14.0, batch), np.random.uniform(0.0, 3.5, batch))
        sugar = np.where(is_healthy_food, np.random.uniform(0.5, 8.0, batch), np.random.uniform(6.0, 38.0, batch))
        total_fat = np.random.uniform(1.0, 32.0, batch)
        saturated_fat = np.where(is_healthy_food, total_fat * np.random.uniform(0.05, 0.20, batch), total_fat * np.random.uniform(0.25, 0.55, batch))
        sodium = np.where(is_healthy_food, np.random.uniform(20, 280, batch), np.random.uniform(350, 1100, batch))
        cholesterol = np.where(is_healthy_food, np.random.uniform(0, 45, batch), np.random.uniform(40, 320, batch))
        potassium = np.random.uniform(80, 850, batch)
        calcium = np.random.uniform(15, 450, batch)
        iron = np.random.uniform(0.4, 10.0, batch)
        glycemic_index_encoded = np.where(is_healthy_food, np.random.choice([1, 2], batch, p=[0.7, 0.3]), np.random.choice([2, 3], batch, p=[0.4, 0.6]))

        # Daily remaining budgets
        phase = np.random.uniform(0.2, 1.0, batch)
        calories_remaining = 2000 * phase
        protein_gap = 70 * phase
        carbs_remaining = 230 * phase
        fiber_gap = 30 * phase
        sugar_remaining = 35 * phase
        sat_fat_remaining = 16 * phase
        sodium_remaining = 2000 * phase
        cholesterol_remaining = 250 * phase
        potassium_remaining = 3500 * phase
        calcium_gap = 1000 * phase
        iron_gap = 18 * phase

        # Continuous Ground Truth Suitability Function
        score = np.full(batch, 72.0)
        score += np.minimum(12.0, (protein / np.maximum(5.0, protein_gap)) * 18.0)
        score += np.minimum(10.0, (fiber / np.maximum(3.0, fiber_gap)) * 16.0)
        score += np.minimum(5.0, (calcium / np.maximum(50.0, calcium_gap)) * 10.0)
        score += np.minimum(5.0, (iron / np.maximum(2.0, iron_gap)) * 10.0)

        score -= np.maximum(0.0, (sodium / np.maximum(50.0, sodium_remaining)) - 0.35) * 32.0
        score -= np.maximum(0.0, (saturated_fat / np.maximum(2.0, sat_fat_remaining)) - 0.35) * 26.0
        score -= np.maximum(0.0, (sugar / np.maximum(4.0, sugar_remaining)) - 0.40) * 24.0
        score -= np.maximum(0.0, (calories / np.maximum(100.0, calories_remaining)) - 0.35) * 20.0

        is_diabetic = cond_dict['fam_DIABETES'] > 0
        score -= is_diabetic * (glycemic_index_encoded == 3) * 25.0
        score -= is_diabetic * (sugar > 12) * 15.0

        is_htn = cond_dict['fam_HYPERTENSION'] > 0
        score -= is_htn * (sodium > 450) * 25.0

        is_ckd = cond_dict['fam_CKD'] > 0
        score -= is_ckd * (potassium > 400) * 28.0
        score -= is_ckd * (sodium > 350) * 18.0

        is_chol = cond_dict['fam_HIGH_CHOLESTEROL'] > 0
        score -= is_chol * (saturated_fat > 4.5) * 20.0
        score -= is_chol * (cholesterol > 120) * 16.0

        noise = np.random.normal(0, 0.8, batch)
        score = np.clip(score + noise, 0.0, 100.0)

        label_idx = np.where(
            score >= 85.0, 4,
            np.where(
                score >= 70.0, 3,
                np.where(
                    score >= 50.0, 2,
                    np.where(score >= 30.0, 1, 0)
                )
            )
        )

        label_map = {0: 'Avoid', 1: 'Limit Intake', 2: 'Consume in Moderation', 3: 'Recommended', 4: 'Highly Recommended'}

        for i in range(batch):
            c = label_idx[i]
            if len(target_classes[c]) < samples_per_class:
                row = {
                    'age': age[i],
                    'gender_encoded': gender_encoded[i],
                    'bmi': round(bmi[i], 1),
                    'systolic_bp': systolic_bp[i],
                    'diastolic_bp': diastolic_bp[i],
                    'fasting_glucose': fasting_glucose[i],
                    'hba1c': round(hba1c[i], 2),
                    'egfr': round(egfr[i], 1),
                    'activity_level_encoded': activity_level_encoded[i],
                    'sleep_hours': round(sleep_hours[i], 1),
                    **{k: cond_dict[k][i] for k in cond_dict},
                    'calories': round(calories[i], 1),
                    'protein': round(protein[i], 1),
                    'carbs': round(carbs[i], 1),
                    'fiber': round(fiber[i], 1),
                    'sugar': round(sugar[i], 1),
                    'total_fat': round(total_fat[i], 1),
                    'saturated_fat': round(saturated_fat[i], 1),
                    'sodium': round(sodium[i], 1),
                    'cholesterol': round(cholesterol[i], 1),
                    'potassium': round(potassium[i], 1),
                    'calcium': round(calcium[i], 1),
                    'iron': round(iron[i], 1),
                    'glycemic_index_encoded': glycemic_index_encoded[i],
                    'calories_remaining': round(calories_remaining[i], 1),
                    'protein_gap': round(protein_gap[i], 1),
                    'carbs_remaining': round(carbs_remaining[i], 1),
                    'fiber_gap': round(fiber_gap[i], 1),
                    'sugar_remaining': round(sugar_remaining[i], 1),
                    'sat_fat_remaining': round(sat_fat_remaining[i], 1),
                    'sodium_remaining': round(sodium_remaining[i], 1),
                    'cholesterol_remaining': round(cholesterol_remaining[i], 1),
                    'potassium_remaining': round(potassium_remaining[i], 1),
                    'calcium_gap': round(calcium_gap[i], 1),
                    'iron_gap': round(iron_gap[i], 1),
                    'suitability_score': round(score[i], 1),
                    'recommendation_label': label_map[c],
                    'recommendation_label_idx': c
                }
                target_classes[c].append(row)

    all_rows = []
    for c in range(5):
        all_rows.extend(target_classes[c])
    
    df = pd.DataFrame(all_rows)
    return df

def main():
    print("=== NutriTrack AI LightGBM Training & ONNX Export Pipeline ===")

    # 1. Generate & persist data_assets/health_food_recommendation_dataset.csv
    os.makedirs("data_assets", exist_ok=True)
    csv_path = os.path.join("data_assets", "health_food_recommendation_dataset.csv")
    
    print("1. Generating 11,000 synthetic interaction rows across 48 features...")
    df = generate_balanced_dataset(2200)
    df.to_csv(csv_path, index=False)
    print(f"   Saved {len(df)} rows to {csv_path}")

    # 2. Extract 48 Features
    exclude_cols = ['suitability_score', 'recommendation_label', 'recommendation_label_idx']
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    print(f"2. Extracted {len(feature_cols)} input features:")
    print(f"   {feature_cols[:8]} ... (+ {len(feature_cols) - 8} more)")
    assert len(feature_cols) == 48, f"Expected 48 features, got {len(feature_cols)}"

    X = df[feature_cols].values.astype(np.float32)
    y_reg = df['suitability_score'].values.astype(np.float32)
    y_class = df['recommendation_label_idx'].values.astype(np.int32)

    X_train, X_test, y_train, y_test, y_class_train, y_class_test = train_test_split(
        X, y_reg, y_class, test_size=0.20, random_state=42, stratify=y_class
    )
    print(f"   Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    # 3. Train LightGBM Regressor
    print("3. Training LightGBM Regressor for continuous suitability score (0-100)...")
    regressor = lgb.LGBMRegressor(
        n_estimators=300,
        learning_rate=0.06,
        num_leaves=63,
        max_depth=7,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        verbosity=-1
    )
    regressor.fit(X_train, y_train)

    preds = regressor.predict(X_test)
    r2 = float(r2_score(y_test, preds))
    mae = float(mean_absolute_error(y_test, preds))
    print(f"   Regressor Evaluation: R^2 Score = {r2:.4f}, MAE = {mae:.2f} points")

    # 4. Train LightGBM Classifier
    print("4. Training LightGBM Classifier for discrete 5-tier classification...")
    classifier = lgb.LGBMClassifier(
        n_estimators=300,
        learning_rate=0.06,
        num_leaves=63,
        max_depth=7,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        verbosity=-1
    )
    classifier.fit(X_train, y_class_train)
    class_preds = classifier.predict(X_test)
    macro_f1 = float(f1_score(y_class_test, class_preds, average='macro'))
    print(f"   Classifier Metric: Macro F1 = {macro_f1:.4f}")
    print("\n   Detailed Classification Report:")
    print(classification_report(y_class_test, class_preds, target_names=[
        'Avoid', 'Limit Intake', 'Consume in Moderation', 'Recommended', 'Highly Recommended'
    ]))

    assert macro_f1 >= 0.88, f"Macro F1 ({macro_f1:.4f}) below required specification floor (0.88)"
    assert r2 >= 0.88, f"R^2 Score ({r2:.4f}) below required specification floor (0.88)"

    # 5. Export Model to ONNX
    models_dir = os.path.join("data_assets", "models")
    os.makedirs(models_dir, exist_ok=True)
    onnx_file_path = os.path.join(models_dir, "nutritrack_lgbm_v1.onnx")

    print(f"5. Converting LightGBM model to ONNX format...")
    initial_type = [('float_input', FloatTensorType([None, len(feature_cols)]))]
    onnx_model = onnxmltools.convert_lightgbm(
        regressor, 
        initial_types=initial_type, 
        target_opset=15
    )

    with open(onnx_file_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"   Exported ONNX model to {onnx_file_path} ({os.path.getsize(onnx_file_path) / 1024:.1f} KB)")

    # 6. Save Model Metadata
    metadata = {
        "model_id": "nutritrack_lgbm_v1",
        "version": "1.0.0",
        "framework": "LightGBM",
        "onnx_opset": 15,
        "input_tensor_name": "float_input",
        "output_tensor_name": "variable",
        "features_count": len(feature_cols),
        "features": feature_cols,
        "metrics": {
            "r2_score": round(r2, 4),
            "mae": round(mae, 2),
            "macro_f1": round(macro_f1, 4),
            "train_samples": len(X_train),
            "test_samples": len(X_test)
        },
        "score_bands": {
            "Highly Recommended": [85.0, 100.0],
            "Recommended": [70.0, 84.9],
            "Consume in Moderation": [50.0, 69.9],
            "Limit Intake": [30.0, 49.9],
            "Avoid": [0.0, 29.9]
        }
    }

    metadata_path = os.path.join(models_dir, "model_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"   Saved metadata to {metadata_path}")
    print("[Success] LightGBM Model training & ONNX export completed successfully!")

if __name__ == "__main__":
    main()
