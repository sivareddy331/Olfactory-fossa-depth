import sys
import os

# Add backend to path
sys.path.append(r"c:\xampp\htdocs\OLfactory_backend")

try:
    from ai_model import ai_processor
    
    test_cases = [
        ("Type 1 (Shallow)", 2.5),
        ("Type 2 (Medium)", 5.5),
        ("Type 3 (Deep)", 12.0)
    ]
    
    print("\nVerifying Dynamic Clinical Analysis:")
    print("-" * 50)
    
    for label, depth_mm in test_cases:
        depth_cm = depth_mm / 10.0
        # Manually trigger the response formatter
        response = ai_processor._format_response(depth_cm, label.split()[0], "status", 90, "Test Model")
        
        analysis = response['analysis']
        print(f"CASE: {label} ({depth_mm}mm)")
        print(f"  Risk Level: {analysis['risk_level']}")
        print(f"  Clinical Implication: {analysis['clinical_implication']}")
        print(f"  Surgical Advice: {analysis['surgical_advice']}")
        print("-" * 50)

    print("\nVerification completed.")

except Exception as e:
    print(f"Verification failed: {e}")
    import traceback
    traceback.print_exc()
