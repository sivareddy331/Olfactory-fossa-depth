package com.simats.olfactory.network;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;
import retrofit2.http.Path;
import retrofit2.http.Query;

/**
 * Main Retrofit API Service for the OLfactory application.
 * Contains all endpoints for authentication, patient management, and AI analysis.
 */
public interface ApiService {

    // --- Authentication ---

    @POST("auth/login")
    Call<TokenResponse> login(@Body UserLogin credentials);

    @POST("auth/register")
    Call<UserResponse> register(@Body UserRegister request);

    @GET("auth/me")
    Call<UserResponse> getMe(@Header("Authorization") String token);

    @POST("auth/forgot-password")
    Call<StatusResponse> forgotPassword(@Body EmailRequest request);

    @POST("auth/verify-otp")
    Call<VerifyOtpResponse> verifyOtp(@Body VerifyOtpRequest request);

    @POST("auth/reset-password")
    Call<ResetPasswordResponse> resetPassword(@Body ResetPasswordRequest request);

    // --- Patients ---

    @GET("patients")
    Call<List<PatientResponse>> getPatients(
            @Header("Authorization") String token,
            @Query("skip") int skip,
            @Query("limit") int limit
    );

    @GET("patients/{patient_id}")
    Call<PatientWithAnalysisResponse> getPatient(
            @Header("Authorization") String token,
            @Path("patient_id") int patientId
    );

    @POST("patients")
    Call<PatientResponse> createPatient(
            @Header("Authorization") String token,
            @Body PatientCreateRequest request
    );

    @DELETE("patients/{patient_id}")
    Call<Void> deletePatient(
            @Header("Authorization") String token,
            @Path("patient_id") int patientId
    );

    // --- Analysis ---

    @Multipart
    @POST("analyze/{patient_id}")
    Call<NewAnalysisResponse> analyzeImage(
            @Header("Authorization") String token,
            @Path("patient_id") int patientId,
            @Part MultipartBody.Part file
    );

    // --- Statistics ---

    @GET("statistics/summary")
    Call<StatisticsSummaryResponse> getSummaryStatistics(@Header("Authorization") String token);

    // --- Model Classes ---

    class UserLogin {
        public String username;
        public String password;
        public UserLogin(String u, String p) { this.username = u; this.password = p; }
    }

    class TokenResponse {
        public String access_token;
        public String token_type;
    }

    class UserResponse {
        public int id;
        public String username;
        public String email;
        public String full_name;
    }

    class UserRegister {
        public String username;
        public String email;
        public String password;
        public String full_name;
        public UserRegister(String username, String email, String password, String full_name) {
            this.username = username;
            this.email = email;
            this.password = password;
            this.full_name = full_name;
        }
    }

    class EmailRequest {
        public String email;
        public EmailRequest(String email) { this.email = email; }
    }

    class VerifyOtpRequest {
        public String otp;
        public VerifyOtpRequest(String otp) { this.otp = otp; }
    }

    class ResetPasswordRequest {
        public String otp;
        public String new_password;
        public ResetPasswordRequest(String otp, String new_password) {
            this.otp = otp;
            this.new_password = new_password;
        }
    }

    class StatusResponse {
        public boolean success;
        public String message;
    }

    class VerifyOtpResponse extends StatusResponse {}
    class ResetPasswordResponse extends StatusResponse {}

    class PatientCreateRequest {
        public String first_name;
        public String last_name;
        public Integer age;
        public String gender;
        public String email;
        public String phone;
        public Integer height;
        public Integer weight;
        public String bmi;
        public String bmi_status;
        public String medical_history;
        public PatientCreateRequest(String f, String l) { this.first_name = f; this.last_name = l; }
    }

    class PatientResponse {
        public int id;
        public String first_name;
        public String last_name;
        public Integer age;
        public String gender;
        public String email;
        public String phone;
        public Integer height;
        public Integer weight;
        public String bmi;
        public String bmi_status;
        public String created_at;
    }

    class PatientWithAnalysisResponse extends PatientResponse {
        public List<AnalysisResultResponse> analysis_results;
    }

    class AnalysisResultResponse {
        public int id;
        public String created_at;
        public Double olfactory_fossa_depth;
        public String depth_status;
        public String risk_level;
        public String clinical_implication;
        public String surgical_advice;
        public String classification_result;
        public Integer classification_confidence;
    }

    class NewAnalysisResponse {
        public String status;
        public String message;
        public AnalysisData data;
    }

    class AnalysisData {
        public int id;
        public int patient_id;
        public String image_url;
        public String original_image_url;
        public Double depth_mm;
        public String keros_classification;
        public String risk_level;
        public String clinical_interpretation;
        public String recommendations;
        public Double confidence_detection;
        public Double confidence_classification;
        public Double processing_time_sec;
    }

    class StatisticsSummaryResponse {
        public int total_patients;
        public int total_analyses;
        public int high_risk_cases;
        public int recent_cases;
        public String latest_analysis_date;
    }
}
