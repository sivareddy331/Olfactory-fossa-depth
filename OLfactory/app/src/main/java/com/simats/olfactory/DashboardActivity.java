package com.simats.olfactory;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SearchView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;

import com.simats.olfactory.network.ApiService;
import com.simats.olfactory.network.RetrofitClient;
import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private RecyclerView rvPatients;
    private PatientAdapter adapter;
    private List<ApiService.PatientResponse> patientList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            setContentView(R.layout.activity_dashboard);
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }
 
        // Handle Camera cutout / Safe Area
        View header = findViewById(R.id.headerLayout);
        if (header != null) {
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(header, (v, insets) -> {
                androidx.core.graphics.Insets statusBar = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars());
                v.setPadding(v.getPaddingLeft(), statusBar.top, v.getPaddingRight(), v.getPaddingBottom());
                return insets;
            });
        }

        // Load User Session Info
        android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
        String displayName = prefs.getString("full_name", "");
        if (displayName == null || displayName.isEmpty()) displayName = prefs.getString("username", "Doctor");
        
        String savedToken = prefs.getString("token", "");
        final String authToken = "Bearer " + savedToken;

        TextView tvWelcomeName = findViewById(R.id.tvWelcomeName);
        if (tvWelcomeName != null) {
            tvWelcomeName.setText(displayName);
            if (displayName.contains("&")) {
                android.text.SpannableString ss = new android.text.SpannableString(displayName);
                int ampersandIndex = displayName.indexOf("&");
                ss.setSpan(new android.text.style.ForegroundColorSpan(android.graphics.Color.parseColor("#00D8FF")), 
                    ampersandIndex, ampersandIndex + 1, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                tvWelcomeName.setText(ss);
            }
        }

        // Initialize RecyclerView
        rvPatients = findViewById(R.id.rvPatients);
        if (rvPatients != null) {
            rvPatients.setLayoutManager(new LinearLayoutManager(this));
            adapter = new PatientAdapter(new ArrayList<>());
            rvPatients.setAdapter(adapter);
        }

        // Fetch data with a small delay to ensure UI is ready
        if (!savedToken.isEmpty()) {
            new Handler(Looper.getMainLooper()).postDelayed(() -> fetchPatients(authToken), 500);
        }

        // Setup Search
        SearchView searchView = findViewById(R.id.searchView);
        if (searchView != null) {
            searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
                @Override
                public boolean onQueryTextSubmit(String query) {
                    if (adapter != null) adapter.filter(query);
                    return false;
                }
                @Override
                public boolean onQueryTextChange(String newText) {
                    if (adapter != null) adapter.filter(newText);
                    return false;
                }
            });
        }

        // Setup Navigation
        BottomNavigationView bottomNav = findViewById(R.id.bottomNav);
        if (bottomNav != null) {
            bottomNav.setOnItemSelectedListener(item -> {
                int id = item.getItemId();
                if (id == R.id.nav_add) {
                    startActivity(new Intent(DashboardActivity.this, PatientDetailsActivity.class));
                } else if (id == R.id.nav_profile) {
                    startActivity(new Intent(DashboardActivity.this, ProfileActivity.class));
                }
                return true;
            });
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        ImageView ivDashAvatar = findViewById(R.id.ivDashAvatar);
        if (ivDashAvatar != null) {
            android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
            String avatarPath = prefs.getString("avatar_path", null);
            if (avatarPath != null) {
                java.io.File imgFile = new java.io.File(avatarPath);
                if (imgFile.exists()) {
                    android.graphics.Bitmap myBitmap = android.graphics.BitmapFactory.decodeFile(imgFile.getAbsolutePath());
                    ivDashAvatar.setImageBitmap(myBitmap);
                    ivDashAvatar.setPadding(0, 0, 0, 0);
                    ivDashAvatar.setImageTintList(null);
                }
            }
        }
    }

    private void fetchPatients(String token) {
        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        apiService.getPatients(token, 0, 100).enqueue(new Callback<List<ApiService.PatientResponse>>() {
            @Override
            public void onResponse(Call<List<ApiService.PatientResponse>> call, Response<List<ApiService.PatientResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    patientList = response.body();
                    if (adapter != null) adapter.updateList(patientList);
                }
            }
            @Override
            public void onFailure(Call<List<ApiService.PatientResponse>> call, Throwable t) {
                String errorMsg = com.simats.olfactory.network.NetworkUtils.getFriendlyErrorMessage(t);
                Toast.makeText(DashboardActivity.this, errorMsg, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void deletePatient(int patientId) {
        android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
        String authToken = "Bearer " + prefs.getString("token", "");
        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        apiService.deletePatient(authToken, patientId).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(DashboardActivity.this, "Patient Removed", Toast.LENGTH_SHORT).show();
                    fetchPatients(authToken);
                }
            }
            @Override
            public void onFailure(Call<Void> call, Throwable t) {}
        });
    }

    class PatientAdapter extends RecyclerView.Adapter<PatientAdapter.ViewHolder> {
        List<ApiService.PatientResponse> fullList;
        List<ApiService.PatientResponse> filteredList;

        PatientAdapter(List<ApiService.PatientResponse> list) {
            this.fullList = list;
            this.filteredList = new ArrayList<>(list);
        }

        void updateList(List<ApiService.PatientResponse> newList) {
            this.fullList = new ArrayList<>(newList);
            this.filteredList = new ArrayList<>(newList);
            notifyDataSetChanged();
        }

        void filter(String query) {
            filteredList.clear();
            if (query.isEmpty()) {
                filteredList.addAll(fullList);
            } else {
                for (ApiService.PatientResponse p : fullList) {
                    String fullName = (p.first_name + " " + p.last_name).toLowerCase();
                    String idStr = String.valueOf(p.id);
                    String dateStr = p.created_at != null ? p.created_at.toLowerCase() : "";
                    
                    if (fullName.contains(query.toLowerCase()) || 
                        idStr.contains(query.toLowerCase()) || 
                        dateStr.contains(query.toLowerCase())) {
                        filteredList.add(p);
                    }
                }
            }
            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_patient, parent, false);
            return new ViewHolder(v);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            if (position >= filteredList.size()) return;
            ApiService.PatientResponse p = filteredList.get(position);
            
            holder.tvName.setText(p.first_name + " " + p.last_name);
            
            String genderStr = (p.gender != null ? p.gender : "N/A");
            String ageStr = (p.age != null ? String.valueOf(p.age) : "??");
            String dateStr = (p.created_at != null && p.created_at.length() >= 10) ? p.created_at.substring(0, 10) : "";
            
            holder.tvInfo.setText("ID: " + p.id + " | " + genderStr + " - " + ageStr + "\nDate: " + dateStr);
            
            holder.itemView.setOnClickListener(v -> {
                Intent intent = new Intent(DashboardActivity.this, PatientDetailsActivity.class);
                intent.putExtra("PATIENT_ID", p.id);
                intent.putExtra("PATIENT_NAME", p.first_name + " " + p.last_name);
                startActivity(intent);
            });

            if (holder.btnDelete != null) {
                holder.btnDelete.setOnClickListener(v -> {
                    new AlertDialog.Builder(DashboardActivity.this)
                        .setTitle("Delete")
                        .setMessage("Remove " + p.first_name + "?")
                        .setPositiveButton("Remove", (dialog, which) -> deletePatient(p.id))
                        .setNegativeButton("Cancel", null)
                        .show();
                });
            }
        }

        @Override
        public int getItemCount() { return filteredList.size(); }

        class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvName, tvInfo;
            MaterialButton btnDelete;
            ViewHolder(View v) {
                super(v);
                tvName = v.findViewById(R.id.tvPatientName);
                tvInfo = v.findViewById(R.id.tvPatientInfo);
                btnDelete = v.findViewById(R.id.btnDeletePatient);
            }
        }
    }
}
