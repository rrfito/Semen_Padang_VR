<style>
    /* Custom Background for Admin Login */
    body {
        background-image: url('/image/BG-Semen_Padang.jpg') !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
    }

    /* Overlay */
    body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6); /* Dark overlay */
        z-index: -1;
    }

    /* Glassmorphism Card */
    .fi-simple-main-ctn {
        background: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 1rem !important;
        padding: 2rem !important;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
    }

    /* Text Colors */
    .fi-simple-header-heading, .fi-simple-header-subheading {
        color: white !important;
    }
    
    label {
        color: #e5e7eb !important; /* Gray-200 */
    }

    /* Inputs */
    input {
        background-color: rgba(0, 0, 0, 0.3) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        color: white !important;
    }
    
    input:focus {
        border-color: #ef4444 !important; /* Red-500 */
        ring-color: #ef4444 !important;
    }

    /* Button */
    button[type="submit"] {
        background-color: #dc2626 !important; /* Red-600 */
        color: white !important;
        font-weight: bold !important;
        transition: all 0.3s ease !important;
    }
    
    button[type="submit"]:hover {
        background-color: #b91c1c !important; /* Red-700 */
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(220, 38, 38, 0.4);
    }
    
    /* Footer/Links */
    .fi-simple-footer a {
        color: #9ca3af !important; /* Gray-400 */
    }
    .fi-simple-footer a:hover {
        color: white !important;
    }
</style>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Ganti Judul "Sign in"
        const heading = document.querySelector('.fi-simple-header-heading');
        if (heading) heading.innerText = 'Administrator Login';

        // Ganti Subjudul "Sign in to your account"
        const subheading = document.querySelector('.fi-simple-header-subheading');
        if (subheading) subheading.innerText = 'Masuk untuk mengelola Virtual Tour';
        
        // Ganti Label Email
        const emailLabel = document.querySelector('label[for="data.email"] span');
        if (emailLabel) emailLabel.innerText = 'Email Perusahaan';
    });
</script>
