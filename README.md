# RGUKT Academic Calculator

![RGUKT Academic Calculator](assets/rgukt-logo.svg)

An official, responsive web application for **Rajiv Gandhi University of Knowledge Technologies (RGUKT)** students to calculate semester SGPA, verify pass/fail status, and export official grade reports in PDF and Image format.

---

## 🌟 Key Features

1. **Complete RGUKT Curriculum Support**:
   - **PUC**: MPC & MBiPC (PUC 1 Sem 1, PUC 1 Sem 2, PUC 2 Sem 1, PUC 2 Sem 2).
   - **Engineering (B.Tech)**: AI & ML, CSE, ECE, EEE, Civil, Mechanical, Chemical, Metallurgy (E1S1 through E4S2 + Summer Internship).
2. **Zero-Credit Subject Rules**:
   - MPC PUC zero-credit courses and Engineering mandatory non-credit courses (e.g., *Indian Constitution*, *Environmental Science*, *Comprehensive Soft Skills*).
   - Only **PASS / FAIL** grade options allowed.
   - Zero-credit courses do not affect SGPA numerical calculation.
   - If a student **FAILS** a zero-credit subject, the semester status is marked as **SEMESTER FAIL**.
3. **Pass / Fail Logic Enforcement**:
   - `SEMESTER FAIL` if ANY credit subject grade is `F` OR ANY zero-credit subject is `FAIL`.
4. **Export Options**:
   - **Download as PDF**: Generates a clean A4 formatted grade report.
   - **Download as Image**: Generates a high-res PNG for mobile/WhatsApp sharing.
   - **Print Report**: Optimized native print CSS layout.
5. **Cumulative CGPA Calculator**:
   - Calculate cumulative overall CGPA across multiple semesters with custom credits weighting.
6. **Dark / Light Theme Toggle**:
   - Crimson RGUKT theme with smooth dark mode support.

---

## 📁 Project Structure

```text
rgukt-academic-calculator/
│
├── index.html              # Main UI & Wizard steps
├── styles.css              # Custom RGUKT design system (Crimson & Gold)
├── app.js                  # State engine, SGPA/CGPA math, PDF & Image export
├── netlify.toml            # Netlify deployment configuration
├── README.md               # Instructions & Documentation
│
├── assets/
│   ├── rgukt-logo.svg      # RGUKT Vector Logo
│   └── rgukt-logo.png      # RGUKT High-Res Logo fallback
│
└── data/
    └── curriculum.json     # Data-driven RGUKT course database
```

---

## 👨‍💻 Developer & Credits

Designed & Developed by **Hemanth Kumar**  
For RGUKT Students across Nuzvid, RK Valley, Srikakulam, and Ongole campuses.
