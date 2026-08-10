/**
 * RGUKT Academic Calculator - Application Engine
 * Handles curriculum data, wizard steps, grade validation, SGPA & CGPA calculation, PDF & PNG export.
 */

// Global App State
const state = {
  curriculumData: null,
  selectedProgram: null,   // 'puc' | 'engineering'
  selectedBranch: null,    // 'mpc', 'mbipc', 'aiml', 'cse', etc.
  selectedSemester: null,  // 'e1s1', 'puc1_sem1', etc.
  currentStep: 1,
  activeCourses: [],       // Array of current semester courses
  studentInfo: {
    name: '',
    id: ''
  },
  calculatedResult: null
};

// Fallback Curriculum Data loaded from official PDF
let fallbackCurriculum = null;

// Grade Point Values
const GRADE_POINTS = {
  'EX': 10,
  'A': 9,
  'B': 8,
  'C': 7,
  'D': 6,
  'E': 5,
  'F': 0
};

// Main App Controller Object
const app = {
  
  async init() {
    console.log("Initializing RGUKT Academic Calculator...");
    this.setupTheme();
    await this.loadCurriculum();
    this.bindEvents();
    this.initCgpaModalRows();
    this.updateProgressUI();
  },

  setupTheme() {
    const savedTheme = localStorage.getItem('rgukt_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      document.getElementById('theme-icon').className = 'fa-solid fa-sun';
    }
  },

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('theme-icon').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    localStorage.setItem('rgukt_theme', isDark ? 'dark' : 'light');
  },

  async loadCurriculum() {
    try {
      const response = await fetch('data/curriculum.json');
      if (!response.ok) throw new Error('Failed to fetch curriculum.json');
      state.curriculumData = await response.json();
      fallbackCurriculum = state.curriculumData;
      console.log("Curriculum data loaded via fetch.");
    } catch (err) {
      console.warn("Using embedded fallback curriculum data due to CORS or local file restriction:", err);
      if (fallbackCurriculum) {
        state.curriculumData = fallbackCurriculum;
      }
    }
  },

  bindEvents() {
    document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());
    document.getElementById('cgpa-calc-btn').addEventListener('click', () => this.openModal('cgpa-modal'));
    document.getElementById('about-modal-btn').addEventListener('click', () => this.openModal('about-modal'));
  },

  // Wizard Step Navigation
  goToStep(stepNumber) {
    // Prevent skipping ahead without selecting required options
    if (stepNumber > 2 && !state.selectedBranch) {
      alert("Please select your program and branch/stream first.");
      return;
    }
    if (stepNumber > 3 && !state.selectedSemester) {
      alert("Please select your semester first.");
      return;
    }

    state.currentStep = stepNumber;

    // Update Step Active Visibility
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');

    this.updateProgressUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  updateProgressUI() {
    const steps = document.querySelectorAll('.step-item');
    const stepCount = steps.length;
    const progressPercent = ((state.currentStep - 1) / (stepCount - 1)) * 100;
    
    document.getElementById('progress-line-fill').style.width = `${progressPercent}%`;

    steps.forEach((step, idx) => {
      const stepNum = idx + 1;
      step.classList.remove('active', 'completed');
      if (stepNum < state.currentStep) {
        step.classList.add('completed');
      } else if (stepNum === state.currentStep) {
        step.classList.add('active');
      }
    });
  },

  // Step 1: Program Selection
  selectProgram(programType) {
    state.selectedProgram = programType;
    state.selectedBranch = null;
    state.selectedSemester = null;

    if (programType === 'puc') {
      document.getElementById('step2-title').textContent = "Select PUC Stream";
      document.getElementById('step2-subtitle').textContent = "Choose your stream (MPC or MBiPC)";
      document.getElementById('puc-stream-container').style.display = 'grid';
      document.getElementById('eng-branch-container').style.display = 'none';
    } else {
      document.getElementById('step2-title').textContent = "Select Engineering Branch";
      document.getElementById('step2-subtitle').textContent = "Choose your B.Tech engineering branch";
      document.getElementById('puc-stream-container').style.display = 'none';
      this.renderEngineeringBranches();
      document.getElementById('eng-branch-container').style.display = 'grid';
    }

    this.goToStep(2);
  },

  renderEngineeringBranches() {
    const container = document.getElementById('eng-branch-container');
    const branches = state.curriculumData.engineering;
    
    container.innerHTML = '';

    for (const [key, branchObj] of Object.entries(branches)) {
      const card = document.createElement('div');
      card.className = `branch-card ${state.selectedBranch === key ? 'selected' : ''}`;
      card.onclick = () => this.selectBranch(key);
      
      const codeUpper = key.toUpperCase();
      card.innerHTML = `
        <span class="branch-code">${codeUpper}</span>
        <span class="branch-name">${branchObj.name}</span>
      `;
      container.appendChild(card);
    }
  },

  // Step 2: Branch Selection
  selectBranch(branchKey) {
    state.selectedBranch = branchKey;
    state.selectedSemester = null;

    this.renderSemesters();
    this.goToStep(3);
  },

  // Step 3: Render Semester Options
  renderSemesters() {
    const container = document.getElementById('semester-grid-container');
    container.innerHTML = '';

    let semData = null;
    let branchName = "";

    if (state.selectedProgram === 'puc') {
      semData = state.curriculumData.puc[state.selectedBranch]?.semesters;
      branchName = state.curriculumData.puc[state.selectedBranch]?.name || state.selectedBranch.toUpperCase();
    } else {
      semData = state.curriculumData.engineering[state.selectedBranch]?.semesters;
      branchName = state.curriculumData.engineering[state.selectedBranch]?.name || state.selectedBranch.toUpperCase();
    }

    document.getElementById('step3-title').textContent = `${branchName}`;
    document.getElementById('step3-subtitle').textContent = "Select your current semester";

    if (!semData) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No semester data available for this branch.</div>`;
      return;
    }

    for (const [semKey, semObj] of Object.entries(semData)) {
      const semCard = document.createElement('div');
      semCard.className = `sem-card ${state.selectedSemester === semKey ? 'selected' : ''}`;
      semCard.textContent = semObj.name;
      semCard.onclick = () => this.selectSemester(semKey, semObj.name);
      container.appendChild(semCard);
    }
  },

  // Step 3: Select Semester
  selectSemester(semKey, semName) {
    state.selectedSemester = semKey;

    let branchObj = state.selectedProgram === 'puc' 
      ? state.curriculumData.puc[state.selectedBranch]
      : state.curriculumData.engineering[state.selectedBranch];

    const semesterObj = branchObj.semesters[semKey];
    state.activeCourses = JSON.parse(JSON.stringify(semesterObj.courses)); // Deep clone

    document.getElementById('step4-title').textContent = `${semName} Grades`;
    document.getElementById('step4-subtitle').textContent = `Select grades for ${branchObj.name}`;

    this.renderCourseTable();
    this.goToStep(4);
  },

  // Step 4: Render Grade Entry Table
  renderCourseTable() {
    const tbody = document.getElementById('course-table-body');
    tbody.innerHTML = '';

    state.activeCourses.forEach((course, index) => {
      const tr = document.createElement('tr');

      const isZero = course.isZeroCredit || course.credits === 0;

      let gradeOptionsHTML = '';

      if (isZero) {
        // Zero Credit PASS / FAIL options
        gradeOptionsHTML = `
          <div class="grade-pill-group zero-pass-fail-group">
            <div class="grade-pill grade-PASS">
              <input type="radio" id="g_${index}_pass" name="course_grade_${index}" value="PASS">
              <label for="g_${index}_pass">PASS</label>
            </div>
            <div class="grade-pill grade-FAIL">
              <input type="radio" id="g_${index}_fail" name="course_grade_${index}" value="FAIL">
              <label for="g_${index}_fail">FAIL</label>
            </div>
          </div>
        `;
      } else {
        // Normal Credit EX / A / B / C / D / E / F options
        const grades = ['EX', 'A', 'B', 'C', 'D', 'E', 'F'];
        gradeOptionsHTML = `<div class="grade-pill-group">` + grades.map(g => `
          <div class="grade-pill grade-${g}">
            <input type="radio" id="g_${index}_${g}" name="course_grade_${index}" value="${g}">
            <label for="g_${index}_${g}">${g}</label>
          </div>
        `).join('') + `</div>`;
      }

      tr.innerHTML = `
        <td>
          <strong>${course.name}</strong>
          ${isZero ? '<span class="zero-credit-tag">Zero Credit</span>' : ''}
        </td>
        <td><strong>${course.credits}</strong></td>
        <td>${gradeOptionsHTML}</td>
      `;

      tbody.appendChild(tr);
    });
  },

  // Add Custom / Elective Course
  addCustomCourse() {
    const name = prompt("Enter Course Name:", "Professional Elective");
    if (!name) return;
    const creditsInput = prompt("Enter Credits (e.g., 3, 1.5, or 0 for zero-credit):", "3");
    if (creditsInput === null) return;
    
    const credits = parseFloat(creditsInput) || 0;
    const isZeroCredit = credits === 0;

    state.activeCourses.push({
      name: name,
      code: '',
      credits: credits,
      isZeroCredit: isZeroCredit
    });

    this.renderCourseTable();
  },

  // Step 4 -> 5: Calculate Result
  calculateResult() {
    let unselectedCount = 0;
    const courseResults = [];

    let totalPoints = 0;
    let totalCredits = 0;
    let hasCreditFail = false;
    let hasZeroCreditFail = false;

    state.activeCourses.forEach((course, index) => {
      const selectedRadio = document.querySelector(`input[name="course_grade_${index}"]:checked`);
      
      if (!selectedRadio) {
        unselectedCount++;
      } else {
        const gradeVal = selectedRadio.value;
        const isZero = course.isZeroCredit || course.credits === 0;

        courseResults.push({
          ...course,
          grade: gradeVal,
          isZero: isZero
        });

        if (isZero) {
          if (gradeVal === 'FAIL') {
            hasZeroCreditFail = true;
          }
        } else {
          if (gradeVal === 'F') {
            hasCreditFail = true;
          }
          const gradePoint = GRADE_POINTS[gradeVal] || 0;
          totalPoints += gradePoint * course.credits;
          totalCredits += course.credits;
        }
      }
    });

    if (unselectedCount > 0) {
      alert(`Please select a grade for all ${state.activeCourses.length} subjects before calculating.`);
      return;
    }

    // SGPA Calculation
    const rawSgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    const sgpaFormatted = rawSgpa.toFixed(2);
    const isSemesterPass = !hasCreditFail && !hasZeroCreditFail;

    state.calculatedResult = {
      sgpa: sgpaFormatted,
      totalCredits: totalCredits,
      isPass: isSemesterPass,
      hasCreditFail: hasCreditFail,
      hasZeroCreditFail: hasZeroCreditFail,
      courseResults: courseResults
    };

    // Capture Student Info
    state.studentInfo.name = document.getElementById('student-name-input').value.trim() || 'ABHI';
    state.studentInfo.id = document.getElementById('student-id-input').value.trim() || 'N230XXX';

    this.renderResultView();
    this.goToStep(5);
  },

  // Step 5: Render Result Summary & Report
  renderResultView() {
    const res = state.calculatedResult;
    if (!res) return;

    // Overview Metric Cards
    document.getElementById('res-sgpa-val').textContent = res.sgpa;
    document.getElementById('res-credits-val').textContent = res.totalCredits;

    const statusBadge = document.getElementById('res-status-badge');
    const alertBanner = document.getElementById('res-alert-banner');
    const alertText = document.getElementById('res-alert-text');

    if (res.isPass) {
      statusBadge.className = 'status-badge pass';
      statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> SEMESTER PASS`;
      alertBanner.style.display = 'none';
    } else {
      statusBadge.className = 'status-badge fail';
      statusBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> SEMESTER FAIL`;
      alertBanner.style.display = 'flex';

      let reasons = [];
      if (res.hasCreditFail) reasons.push("Failed in one or more credit subjects (F grade).");
      if (res.hasZeroCreditFail) reasons.push("Failed in a mandatory zero-credit subject.");
      
      alertText.textContent = reasons.join(" ");
    }

    // Render Report Container Metadata
    document.getElementById('report-date-str').textContent = new Date().toLocaleDateString('en-GB');
    document.getElementById('report-meta-name').textContent = state.studentInfo.name;
    document.getElementById('report-meta-id').textContent = state.studentInfo.id;

    let branchName = state.selectedProgram === 'puc' 
      ? state.curriculumData.puc[state.selectedBranch].name
      : state.curriculumData.engineering[state.selectedBranch].name;

    let semName = state.selectedProgram === 'puc'
      ? state.curriculumData.puc[state.selectedBranch].semesters[state.selectedSemester].name
      : state.curriculumData.engineering[state.selectedBranch].semesters[state.selectedSemester].name;

    document.getElementById('report-meta-branch').textContent = branchName;
    document.getElementById('report-meta-sem').textContent = semName;

    // Report Table Body
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';

    res.courseResults.forEach(c => {
      const tr = document.createElement('tr');
      const gradeColorClass = c.isZero 
        ? (c.grade === 'PASS' ? 'color: var(--success); font-weight:700;' : 'color: var(--danger); font-weight:700;')
        : (c.grade === 'F' ? 'color: var(--danger); font-weight:700;' : 'font-weight:700;');

      tr.innerHTML = `
        <td><strong>${c.name}</strong> ${c.isZero ? '<span class="zero-credit-tag">Zero Credit</span>' : ''}</td>
        <td><strong>${c.credits}</strong></td>
        <td><span style="${gradeColorClass}">${c.grade}</span></td>
      `;
      tbody.appendChild(tr);
    });

    // Report Summary Bar
    document.getElementById('report-summary-credits').textContent = res.totalCredits;
    document.getElementById('report-summary-sgpa').textContent = res.sgpa;
    
    const repStatus = document.getElementById('report-summary-status');
    if (res.isPass) {
      repStatus.className = 'status-badge pass';
      repStatus.innerHTML = `<i class="fa-solid fa-check"></i> SEMESTER PASS`;
    } else {
      repStatus.className = 'status-badge fail';
      repStatus.innerHTML = `<i class="fa-solid fa-xmark"></i> SEMESTER FAIL`;
    }
  },

  // Export PDF Handler
  exportPDF() {
    const reportElement = document.getElementById('export-report-container');
    const opt = {
      margin:       0.4,
      filename:     `Rajiv_Gandhi_University_${state.selectedBranch.toUpperCase()}_${state.selectedSemester}_Result.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(reportElement).save();
    } else {
      alert("PDF generator library loading. Please check internet connection or use browser Print -> Save as PDF.");
      window.print();
    }
  },

  // Export Image Handler
  exportImage() {
    const reportElement = document.getElementById('export-report-container');
    if (window.html2canvas) {
      window.html2canvas(reportElement, { scale: 3, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Rajiv_Gandhi_University_${state.selectedBranch.toUpperCase()}_${state.selectedSemester}_Result.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    } else {
      alert("Image generator library is loading. Please try again in a few seconds.");
    }
  },

  // Cumulative CGPA Modal Functions
  initCgpaModalRows() {
    this.setCgpaProgram(state.selectedProgram === 'puc' ? 'puc' : 'engineering');
  },

  populateCgpaBranchDropdown(programType) {
    const dropdown = document.getElementById('cgpa-branch-dropdown');
    const wrapper = document.getElementById('cgpa-branch-select-wrapper');
    if (!dropdown || !wrapper || !state.curriculumData) return;

    if (programType === 'custom') {
      wrapper.style.display = 'none';
      return;
    }

    wrapper.style.display = 'block';
    dropdown.innerHTML = '';

    const branches = programType === 'puc' 
      ? state.curriculumData.puc 
      : state.curriculumData.engineering;

    if (!branches) return;

    // Set default selected branch if none is set
    if (!state.cgpaSelectedBranch || !branches[state.cgpaSelectedBranch]) {
      state.cgpaSelectedBranch = programType === 'puc' ? 'mpc' : 'aiml';
    }

    for (const [key, bObj] of Object.entries(branches)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = bObj.name || key.toUpperCase();
      if (key === state.cgpaSelectedBranch) {
        opt.selected = true;
      }
      dropdown.appendChild(opt);
    }
  },

  onCgpaBranchChange(branchKey) {
    state.cgpaSelectedBranch = branchKey;
    this.setCgpaProgram(state.cgpaProgram || 'engineering');
  },

  setCgpaProgram(type) {
    state.cgpaProgram = type;

    // Toggle button active classes
    const pucBtn = document.getElementById('cgpa-tab-puc');
    const engBtn = document.getElementById('cgpa-tab-eng');
    const customBtn = document.getElementById('cgpa-tab-custom');

    if (pucBtn && engBtn && customBtn) {
      pucBtn.className = type === 'puc' ? 'btn btn-primary' : 'btn btn-secondary';
      engBtn.className = type === 'engineering' ? 'btn btn-primary' : 'btn btn-secondary';
      customBtn.className = type === 'custom' ? 'btn btn-primary' : 'btn btn-secondary';
    }

    this.populateCgpaBranchDropdown(type);

    const container = document.getElementById('cgpa-rows-container');
    if (!container) return;
    container.innerHTML = '';

    const activeBranchKey = state.cgpaSelectedBranch || (type === 'puc' ? 'mpc' : 'aiml');

    if (type === 'puc') {
      const semKeys = ['puc1_sem1', 'puc1_sem2', 'puc2_sem1', 'puc2_sem2'];
      const labels = ['PUC-I Sem-I', 'PUC-I Sem-II', 'PUC-II Sem-I', 'PUC-II Sem-II'];
      
      let pucSemesters = state.curriculumData && state.curriculumData.puc[activeBranchKey] 
        ? state.curriculumData.puc[activeBranchKey].semesters 
        : null;

      labels.forEach((lbl, idx) => {
        let creditsVal = 24;
        const semKey = semKeys[idx];
        if (pucSemesters && pucSemesters[semKey]) {
          creditsVal = pucSemesters[semKey].courses.reduce((sum, c) => sum + (c.isZeroCredit ? 0 : c.credits), 0);
        }
        this.addCgpaRow(lbl, '', creditsVal);
      });
    } else if (type === 'engineering') {
      const semKeys = ['e1s1', 'e1s2', 'e2s1', 'e2s2', 'e3s1', 'e3s2', 'e4s1', 'e4s2'];
      const labels = ['E1-S1', 'E1-S2', 'E2-S1', 'E2-S2', 'E3-S1', 'E3-S2', 'E4-S1', 'E4-S2'];
      
      let branchSemesters = state.curriculumData && state.curriculumData.engineering[activeBranchKey] 
        ? state.curriculumData.engineering[activeBranchKey].semesters 
        : null;

      labels.forEach((lbl, idx) => {
        let creditsVal = 20;
        const semKey = semKeys[idx];

        if (branchSemesters && branchSemesters[semKey]) {
          creditsVal = branchSemesters[semKey].courses.reduce((sum, c) => sum + (c.isZeroCredit ? 0 : c.credits), 0);
        }

        this.addCgpaRow(lbl, '', creditsVal);
      });
    } else {
      for (let i = 1; i <= 4; i++) {
        this.addCgpaRow(`Semester ${i}`, '', 20);
      }
    }

    document.getElementById('cgpa-result-box').style.display = 'none';
  },

  addCgpaRow(labelPrefix = null, defaultSgpa = '', defaultCredits = 20) {
    const container = document.getElementById('cgpa-rows-container');
    if (!container) return;
    
    const rowCount = container.children.length + 1;
    const label = labelPrefix || `Semester ${rowCount}`;

    const row = document.createElement('div');
    row.className = 'cgpa-sem-row';
    row.innerHTML = `
      <span style="font-size:0.85rem; font-weight:700; min-width: 100px; color: var(--text-main);">${label}</span>
      <input type="number" step="0.01" min="0" max="10" value="${defaultSgpa}" placeholder="SGPA (e.g. 8.5)" class="cgpa-sgpa-input">
      <input type="number" step="0.5" min="0" value="${defaultCredits}" placeholder="Credits" class="cgpa-credits-input">
    `;
    container.appendChild(row);
  },

  calculateCumulativeCGPA() {
    const sgpaInputs = document.querySelectorAll('.cgpa-sgpa-input');
    const creditsInputs = document.querySelectorAll('.cgpa-credits-input');

    let totalPoints = 0;
    let totalCredits = 0;
    let validSemsCount = 0;

    sgpaInputs.forEach((sgpaIn, i) => {
      const sgpa = parseFloat(sgpaIn.value);
      const credits = parseFloat(creditsInputs[i].value);

      if (!isNaN(sgpa) && !isNaN(credits) && credits > 0) {
        totalPoints += sgpa * credits;
        totalCredits += credits;
        validSemsCount++;
      }
    });

    if (totalCredits === 0 || validSemsCount === 0) {
      alert("Please enter valid SGPA and Credits for at least one semester.");
      return;
    }

    const cgpa = (totalPoints / totalCredits).toFixed(2);

    document.getElementById('cgpa-val').textContent = cgpa;
    document.getElementById('cgpa-detail-breakdown').textContent = 
      `Total Points: ${totalPoints.toFixed(1)} ÷ Total Credits: ${totalCredits} (${validSemsCount} Semesters)`;
    document.getElementById('cgpa-result-box').style.display = 'block';
  },

  // Modal Controls
  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  },

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }
};

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
