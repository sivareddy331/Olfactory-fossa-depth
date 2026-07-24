def assess_surgical_risk(keros_type, avg_depth):
    """
    Generate surgical risk level and anatomical explanations based on Keros Type.
    """
    if keros_type == "Keros Type I":
        risk_level = "Low Risk"
        explanation = (
            f"The average olfactory fossa depth is {avg_depth} mm (Keros Type I). "
            "The cribriform plate lies nearly level with the fovea ethmoidalis, "
            "resulting in a short lateral lamella and a low risk of accidental intracranial penetration during surgery."
        )
    elif keros_type == "Keros Type II":
        risk_level = "Moderate Risk"
        explanation = (
            f"The average olfactory fossa depth is {avg_depth} mm (Keros Type II). "
            "The lateral lamella has moderate height (4-7 mm), exposing a thin bone segment "
            "between the olfactory fossa and ethmoid roof. Standard surgical precautions are advised."
        )
    else:
        risk_level = "High Risk"
        explanation = (
            f"The average olfactory fossa depth is {avg_depth} mm (Keros Type III). "
            "The cribriform plate is deeply positioned (8 mm or more below the fovea ethmoidalis). "
            "This creates an extremely long, thin lateral lamella that is highly vulnerable to accidental puncture "
            "during sinus surgery, posing a major risk of cerebrospinal fluid (CSF) rhinorrhea."
        )
        
    return risk_level, explanation
