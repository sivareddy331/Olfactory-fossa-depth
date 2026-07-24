package com.simats.olfactory;

import android.text.Editable;
import android.text.TextWatcher;
import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.annotation.NonNull;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.simats.olfactory.network.ApiService;
import com.simats.olfactory.network.RetrofitClient;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PatientDetailsActivity extends AppCompatActivity {

    private int patientId = -1;
    private String patientName = "";
    private com.google.android.material.textfield.TextInputEditText etFirstName, etLastName, etAge, etHeight, etWeight, etEmail, etPhone, etBMI, etStatus;
    private com.google.android.material.textfield.MaterialAutoCompleteTextView etGender;
    private RecyclerView rvAnalyses;
    private AnalysisAdapter analysisAdapter;
    private List<ApiService.AnalysisResultResponse> analysisList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_patient_details);
 
        // Handle Camera cutout / Safe Area
        final View tBar = findViewById(R.id.topBar);
        if (tBar != null) {
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(tBar, (v, insets) -> {
                androidx.core.graphics.Insets statusBar = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars());
                v.setPadding(v.getPaddingLeft(), statusBar.top, v.getPaddingRight(), v.getPaddingBottom());
                return insets;
            });
        }

        // Get intent extras (if coming from DashboardActivity via patient tap)
        patientId = getIntent().getIntExtra("PATIENT_ID", -1);
        patientName = getIntent().getStringExtra("PATIENT_NAME");
        if (patientName == null) patientName = "";

        ImageView btnBack = findViewById(R.id.btnBack);
        MaterialButton btnUpload = findViewById(R.id.btnUpload);

        etFirstName = findViewById(R.id.etFirstName);
        etLastName = findViewById(R.id.etLastName);
        etAge = findViewById(R.id.etAge);
        etGender = findViewById(R.id.etGender);
        etHeight = findViewById(R.id.etHeight);
        etWeight = findViewById(R.id.etWeight);
        etEmail = findViewById(R.id.etEmail);
        etPhone = findViewById(R.id.etPhone);
        etBMI = findViewById(R.id.etBMI);
        etStatus = findViewById(R.id.etStatus);
        
        // Make calculated fields read-only
        etBMI.setFocusable(false);
        etBMI.setClickable(false);
        etStatus.setFocusable(false);
        etStatus.setClickable(false);
        rvAnalyses = findViewById(R.id.rvAnalyses);

        // Completely disable autofill on Height and Weight to prevent
        // Android from pasting phone numbers into these numeric fields
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            etHeight.setImportantForAutofill(android.view.View.IMPORTANT_FOR_AUTOFILL_NO);
            etWeight.setImportantForAutofill(android.view.View.IMPORTANT_FOR_AUTOFILL_NO);
            etHeight.setAutofillHints((String[]) null);
            etWeight.setAutofillHints((String[]) null);
        }
        // Also clear InputType temporarily then restore to break autofill detection
        etHeight.setTag("height_field");
        etWeight.setTag("weight_field");
        etHeight.setPrivateImeOptions("defaultInputmode=english;nm");
        etWeight.setPrivateImeOptions("defaultInputmode=english;nm");
        
        rvAnalyses.setLayoutManager(new LinearLayoutManager(this));
        analysisAdapter = new AnalysisAdapter(analysisList);
        rvAnalyses.setAdapter(analysisAdapter);

        // Setup Gender Dropdown
        String[] genders = {"Male", "Female", "Others"};
        android.widget.ArrayAdapter<String> genderAdapter = new android.widget.ArrayAdapter<>(
                this, android.R.layout.simple_list_item_1, genders);
        etGender.setAdapter(genderAdapter);

        etEmail.setFilters(new android.text.InputFilter[] {
            (source, start, end, dest, dstart, dend) -> {
                StringBuilder sb = new StringBuilder();
                for (int i = start; i < end; i++) {
                    char c = source.charAt(i);
                    if (!Character.isWhitespace(c)) {
                        sb.append(Character.toLowerCase(c));
                    }
                }
                return sb.toString();
            }
        });

        btnBack.setOnClickListener(v -> finish());

        // Setup BMI auto-calculation
        TextWatcher bmiWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                calculateBMI();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        };

        etHeight.addTextChangedListener(bmiWatcher);
        etWeight.addTextChangedListener(bmiWatcher);

        btnUpload.setOnClickListener(v -> {
            String fName = etFirstName.getText().toString().trim();
            String lName = etLastName.getText().toString().trim();
            String ageStr = etAge.getText().toString().trim();
            String gender = etGender.getText().toString().trim();
            String phone = etPhone.getText().toString().trim();
            String height = etHeight.getText().toString().trim();
            String weight = etWeight.getText().toString().trim();
            String bmi = etBMI.getText().toString().trim();
            String status = etStatus.getText().toString().trim();

            boolean isValid = true;
            if (fName.isEmpty()) { etFirstName.setError("Patient First Name is required"); isValid = false; }
            if (lName.isEmpty()) { etLastName.setError("Patient Last Name is required"); isValid = false; }
            if (ageStr.isEmpty()) { etAge.setError("Age is required"); isValid = false; }
            if (gender.isEmpty()) { etGender.setError("Gender is required"); isValid = false; }
            if (phone.isEmpty()) { etPhone.setError("Phone is required"); isValid = false; }
            if (height.isEmpty()) { etHeight.setError("Height is required"); isValid = false; }
            if (weight.isEmpty()) { etWeight.setError("Weight is required"); isValid = false; }

            if (!isValid) {
                Toast.makeText(PatientDetailsActivity.this, "Please complete all mandatory fields", Toast.LENGTH_SHORT).show();
                return;
            }

            if (patientId == -1) {
                savePatientAndUpload();
            } else {
                Intent intent = new Intent(PatientDetailsActivity.this, UploadImageActivity.class);
                intent.putExtra("PATIENT_ID", patientId);
                startActivity(intent);
            }
        });

        BottomNavigationView bottomNav = findViewById(R.id.bottomNav);
        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_home) {
                finish();
            } else if (id == R.id.nav_profile) {
                startActivity(new Intent(PatientDetailsActivity.this, ProfileActivity.class));
            }
            return true;
        });

        ImageView btnDelete = findViewById(R.id.btnDelete);
 
        // If viewing an existing patient, load their data and show delete button
        if (patientId != -1) {
            loadPatientDetails();
            btnDelete.setVisibility(View.VISIBLE);
        } else {
            btnDelete.setVisibility(View.GONE);
        }
 
        btnDelete.setOnClickListener(v -> {
            new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Delete Patient")
                .setMessage("Are you sure you want to permanently delete " + patientName + "?")
                .setPositiveButton("Delete", (dialog, which) -> deletePatient())
                .setNegativeButton("Cancel", null)
                .show();
        });
    }
 
    private void deletePatient() {
        android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
        String token = "Bearer " + prefs.getString("token", "");
 
        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        apiService.deletePatient(token, patientId).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(PatientDetailsActivity.this, "Patient deleted successfully", Toast.LENGTH_SHORT).show();
                    finish(); // Go back to dashboard
                } else {
                    String errorDetail = "Error: " + response.code();
                    try {
                        if (response.errorBody() != null) {
                            errorDetail += "\n" + response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(PatientDetailsActivity.this, "Failed to delete patient: " + errorDetail, Toast.LENGTH_LONG).show();
                }
            }
 
            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(PatientDetailsActivity.this, "Network Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void loadPatientDetails() {
        android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
        String token = "Bearer " + prefs.getString("token", "");

        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        apiService.getPatient(token, patientId).enqueue(new Callback<ApiService.PatientWithAnalysisResponse>() {
            @Override
            public void onResponse(Call<ApiService.PatientWithAnalysisResponse> call,
                                   Response<ApiService.PatientWithAnalysisResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiService.PatientWithAnalysisResponse patient = response.body();
                    etFirstName.setText(patient.first_name);
                    etLastName.setText(patient.last_name);
                    if (patient.age != null) etAge.setText(String.valueOf(patient.age));
                    if (patient.gender != null) etGender.setText(patient.gender, false);
                    etEmail.setText(patient.email);
                    etPhone.setText(patient.phone);
                    if (patient.height != null) etHeight.setText(String.valueOf(patient.height));
                    if (patient.weight != null) etWeight.setText(String.valueOf(patient.weight));
                    etBMI.setText(patient.bmi);
                    etStatus.setText(patient.bmi_status);
                    
                    // Populate analysis history
                    if (patient.analysis_results != null) {
                        analysisList.clear();
                        analysisList.addAll(patient.analysis_results);
                        analysisAdapter.notifyDataSetChanged();
                    }
                }
            }

            @Override
            public void onFailure(Call<ApiService.PatientWithAnalysisResponse> call, Throwable t) {
                Toast.makeText(PatientDetailsActivity.this,
                        "Failed to load patient: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
 
    private void calculateBMI() {
        String heightStr = etHeight.getText().toString().trim();
        String weightStr = etWeight.getText().toString().trim();
 
        if (!heightStr.isEmpty() && !weightStr.isEmpty()) {
            try {
                float heightCm = Float.parseFloat(heightStr);
                float weightKg = Float.parseFloat(weightStr);
 
                if (heightCm > 0 && weightKg > 0) {
                    float heightM = heightCm / 100;
                    float bmi = weightKg / (heightM * heightM);
                    
                    // Format to 1 decimal place
                    String bmiValue = String.format("%.1f", bmi);
                    etBMI.setText(bmiValue);
 
                    // Update Status based on BMI
                    // Underweight: < 18.5
                    // Healthy Weight (Normal): 18.5 – 24.9
                    // Overweight: 25.0 – 29.9
                    // Obesity: 30.0 or higher
                    String status;
                    if (bmi < 18.5f) {
                        status = "Underweight";
                    } else if (bmi <= 24.9f) {
                        status = "Healthy Weight (Normal)";
                    } else if (bmi <= 29.9f) {
                        status = "Overweight";
                    } else {
                        status = "Obesity";
                    }
                    etStatus.setText(status);
                } else {
                    etBMI.setText("");
                    etStatus.setText("");
                }
            } catch (NumberFormatException e) {
                etBMI.setText("");
                etStatus.setText("");
            }
        } else {
            etBMI.setText("");
            etStatus.setText("");
        }
    }
 
    private void savePatientAndUpload() {
        String firstName = etFirstName.getText().toString().trim();
        String lastName = etLastName.getText().toString().trim();
        String ageStr = etAge.getText().toString().trim();
        String gender = etGender.getText().toString().trim();
        String phone = etPhone.getText().toString().trim();
        String height = etHeight.getText().toString().trim();
        String weight = etWeight.getText().toString().trim();
        String bmi = etBMI.getText().toString().trim();
        String status = etStatus.getText().toString().trim();

        boolean isValid = true;
        if (firstName.isEmpty()) { etFirstName.setError("Patient First Name is required"); isValid = false; }
        if (lastName.isEmpty()) { etLastName.setError("Patient Last Name is required"); isValid = false; }
        if (ageStr.isEmpty()) { etAge.setError("Age is required"); isValid = false; }
        if (gender.isEmpty()) { etGender.setError("Gender is required"); isValid = false; }
        if (phone.isEmpty()) { etPhone.setError("Phone is required"); isValid = false; }
        if (height.isEmpty()) { etHeight.setError("Height is required"); isValid = false; }
        if (weight.isEmpty()) { etWeight.setError("Weight is required"); isValid = false; }

        if (!isValid) {
            Toast.makeText(this, "Please complete all mandatory fields", Toast.LENGTH_SHORT).show();
            return;
        }

        android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
        String token = "Bearer " + prefs.getString("token", "");

        ApiService.PatientCreateRequest request = new ApiService.PatientCreateRequest(firstName, lastName);
        try {
            if (!ageStr.isEmpty()) request.age = Integer.parseInt(ageStr);
        } catch (NumberFormatException e) { }
        request.gender = gender;
        String email = etEmail.getText().toString().trim();
        if (!email.isEmpty() && !email.matches("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$")) {
            Toast.makeText(this, "Patient email must be valid, entirely in lowercase, and contain no spaces.", Toast.LENGTH_LONG).show();
            return;
        }
        request.email = email.isEmpty() ? null : email;
        request.phone = phone.isEmpty() ? null : phone;
        try {
            if (!height.isEmpty()) request.height = (int) Float.parseFloat(height);
            if (!weight.isEmpty()) request.weight = (int) Float.parseFloat(weight);
        } catch (NumberFormatException e) { }
        request.bmi = bmi.isEmpty() ? null : bmi;
        request.bmi_status = status.isEmpty() ? null : status;
        request.medical_history = null; // Layout doesn't have this field yet

        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        apiService.createPatient(token, request).enqueue(new Callback<ApiService.PatientResponse>() {
            @Override
            public void onResponse(Call<ApiService.PatientResponse> call, Response<ApiService.PatientResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    patientId = response.body().id;
                    Toast.makeText(PatientDetailsActivity.this, "Patient saved!", Toast.LENGTH_SHORT).show();
                    
                    Intent intent = new Intent(PatientDetailsActivity.this, UploadImageActivity.class);
                    intent.putExtra("PATIENT_ID", patientId);
                    startActivity(intent);
                } else {
                    Toast.makeText(PatientDetailsActivity.this, "Failed to save patient: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiService.PatientResponse> call, Throwable t) {
                Toast.makeText(PatientDetailsActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    class AnalysisAdapter extends RecyclerView.Adapter<AnalysisAdapter.ViewHolder> {
        private List<ApiService.AnalysisResultResponse> list;

        AnalysisAdapter(List<ApiService.AnalysisResultResponse> list) { this.list = list; }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_analysis, parent, false);
            return new ViewHolder(v);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            ApiService.AnalysisResultResponse a = list.get(position);
            holder.tvType.setText(a.classification_result != null ? a.classification_result : "Analysis");
            
            // depth is already stored in mm in the database
            double depthMm = a.olfactory_fossa_depth != null ? a.olfactory_fossa_depth : 0.0;
            holder.tvDepth.setText(String.format("Depth: %.2f mm", depthMm));
            
            // Format date
            if (a.created_at != null && a.created_at.length() >= 16) {
                holder.tvDate.setText(a.created_at.substring(0, 16).replace("T", " "));
            } else { holder.tvDate.setText(a.created_at); }

            holder.itemView.setOnClickListener(v -> {
                Intent intent = new Intent(PatientDetailsActivity.this, ResultActivity.class);
                String typeStr = a.classification_result != null ? a.classification_result : "Type 1";
                int typeInt = 1;
                if (typeStr.contains("2")) typeInt = 2;
                else if (typeStr.contains("3")) typeInt = 3;
                
                intent.putExtra("TYPE", typeInt);
                intent.putExtra("DEPTH", depthMm);
                intent.putExtra("RISK_LEVEL", a.risk_level);
                intent.putExtra("IMPLICATION", a.clinical_implication);
                intent.putExtra("ADVICE", a.surgical_advice);
                startActivity(intent);
            });
        }

        @Override
        public int getItemCount() { return list.size(); }

        class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvType, tvDepth, tvDate;
            ViewHolder(View v) {
                super(v);
                tvType = v.findViewById(R.id.tvAnalysisType);
                tvDepth = v.findViewById(R.id.tvAnalysisDepth);
                tvDate = v.findViewById(R.id.tvAnalysisDate);
            }
        }
    }
}
