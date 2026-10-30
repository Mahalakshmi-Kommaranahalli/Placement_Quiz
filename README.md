# CSE Placement Quiz Arena
> **5th Semester CSE | Student Forum Activity**  
> An interactive, responsive, high-performance MCQ placement assessment platform built for 5th Semester Computer Science and Engineering students, featuring **Strict Tab-Switching Proctoring** and a dedicated **Faculty Admin & Audit Console**.

---

## 📌 Project Overview

**CSE Placement Quiz Arena** is a modern frontend assessment web application designed to prepare 5th Semester CSE students for placement aptitude and technical screening rounds. Sourced directly from the official faculty document **`5th_Sem_CSE_Placement_Quiz_30_Questions.docx`**, this platform tests students across 30 curated multiple-choice questions spanning core computer science disciplines.

### Key Highlights
- **100% Faithful Question Bank**: Exactly 30 questions, 4 options each, and official faculty answer key extracted with zero omissions, replacements, or alterations.
- **Strict Tab-Switching Proctoring**: Navigating away from the exam window or switching browser tabs **immediately terminates the assessment** with a proctoring violation auto-submission.
- **Dedicated Faculty Admin Console (`admin.html`)**: Separate administrative portal featuring real-time session tracking, candidate response auditing, question difficulty matrices, and CSV data export.
- **Candidate Onboarding**: Validated student registration capturing Student Name and USN with auto-uppercasing.
- **Real-Time 30-Minute Timer**: Digital countdown timer with automatic warning alerts at **5 minutes** (amber) and **1 minute** (pulsating red), plus zero-mark timeout auto-submission.
- **Question Palette (1–30)**: Live tracking of question states (**Current**, **Answered**, **Visited / Unanswered**, **Unvisited**) with direct navigation.
- **Grading & Scoring Engine**: Automated calculation of Score out of 30, Percentage, Accuracy, and categorized Performance Verdicts based on official bands.
- **Detailed Conceptual Review**: Comprehensive post-submission review with question status tags (Correct, Incorrect, Unanswered), faculty key highlights, student selection indicators, filter tabs, and expandable conceptual explanations.
- **Real-Time Inter-Tab Broadcasting**: Uses HTML5 `BroadcastChannel` and `StorageEvent` APIs so the Admin Console automatically reflects student progress, answers, and violations live without manual reloads.
- **Zero External Dependencies**: Pure Vanilla HTML5, CSS3, and JavaScript — works instantly offline or locally in any modern browser without npm, node, servers, or API keys.

---

## 🌐 URLs & Navigation

| Portal | URL / File | Access / Credentials | Purpose |
|---|---|---|---|
| **Student Assessment Portal** | [`index.html`](file:///c:/Users/sjaga/OneDrive/Desktop/Placement%20Quiz/CSE_Placement_Quiz_Arena/index.html) | Direct Access (No Password)<br>*(Zero Admin links on page)* | Mobile-optimized test interface for students: registration, timed MCQ arena, instant score, answer review, and attempt history. |
| **Faculty Admin Console** | [`admin.html`](file:///c:/Users/sjaga/OneDrive/Desktop/Placement%20Quiz/CSE_Placement_Quiz_Arena/admin.html) | Security PIN: `admin123` | Standalone administrative URL for faculty: real-time proctoring feed, candidate response auditing, violation logs, and CSV export. |

---

## 🚀 How to Run Locally

You can run the platform without build tools, dependencies, or a database. Use a lightweight local web server so the student and admin pages share browser storage.

### Option 1: Python Built-In HTTP Server (Recommended)
The student and admin pages must use the **same host and port** to share browser storage and live updates. Do not open the HTML files directly with `file://`, or mix `localhost` and `127.0.0.1`.

1. Open PowerShell / Command Prompt in the `CSE_Placement_Quiz_Arena` folder and run:
   ```bash
   python -m http.server 8080
   ```
2. Open the student portal at `http://localhost:8080/index.html`.
3. Open the admin console at `http://localhost:8080/admin.html`.

### Option 2: Run via VS Code / Antigravity Live Server
1. Open the `Placement Quiz` workspace in VS Code or Antigravity.
2. Right-click `CSE_Placement_Quiz_Arena/index.html` and choose **"Open with Live Server"**.
3. In another tab, open `admin.html` through that same Live Server origin. Do not change the hostname or port.

---

## 🛡️ Strict Tab-Switching Proctoring System

To enforce academic integrity during student forum placement assessments:
1. **Detection Mechanism**: The engine listens continuously to browser `visibilitychange` and `blur` events on the active quiz window.
2. **Immediate Disqualification**: If a student navigates away, switches to another browser tab, or minimizes the browser, the test is **instantly terminated**.
3. **Automated Submission**: Answers chosen up to the violation are locked and submitted automatically.
4. **Violation Logging**:
   - The candidate is transitioned to a dedicated **Assessment Terminated Screen**.
   - The attempt is flagged as `⚠️ Disqualified (Tab Switch)` with an exact timestamp.
   - A real-time violation event is transmitted to `admin.html` via `BroadcastChannel`.

---

## 🏛️ Faculty Admin & Oversight Console (`admin.html`)

The separate Admin Console offers an executive, classic academic dashboard:
1. **Real-Time Live Feed**:
   - Live synchronization with candidate tabs: reflects new test registrations, answer clicks, question navigation, tab-switch violations, and submissions in real time.
2. **Executive KPI Dashboard**:
   - Total Submissions
   - Cohort Average Score (out of 30) & Mean Accuracy %
   - Placement Ready Count (Score >= 27) & Cohort %
   - Cohort High Score & Top Performer Name
   - Tab-Switch Violations Count (Red alert metric)
   - Live Active Sessions Count
3. **In-Progress Sessions Monitor**:
   - Displays candidates currently testing, their current question, questions answered so far, and remaining time.
4. **Candidate Directory & Search**:
   - Live instant search by Student Name or USN.
   - Filter tabs: *All Submissions*, *Completed*, *⚠️ Disqualified (Tab Switch)*, *Placement Ready*.
   - **Inspect Answers Button**: Opens a full modal audit sheet showing every single question, candidate choice vs faculty answer key, and explanation.
5. **Question Difficulty & Error Analysis Matrix**:
   - Item analysis for all 30 questions calculated across the cohort.
   - Ranks questions by cohort accuracy rate and classifies them as *Easy*, *Moderate*, or *Hard (High Error)* to guide faculty review sessions.
6. **CSV Export**:
   - Downloads a formatted `CSE_Placement_Quiz_Results.csv` spreadsheet ready for Excel/Google Sheets.

---

## 📂 Project Architecture

```
CSE_Placement_Quiz_Arena/
├── index.html       # Candidate portal (Registration, Quiz Arena, Violation Screen, Results)
├── style.css        # Premium dark navy UI, electric blue accents, responsive layout & print styles
├── script.js        # Test engine, tab-switch proctoring, timer, palette, grading & live broadcasting
├── questions.js     # Structured dataset of all 30 source questions, options, keys & explanations
├── admin.html       # Standalone Faculty Admin & Audit Console URL
├── admin.css        # Executive institutional styling for admin dashboard, tables & inspector
├── admin.js         # Real-time listener, KPI calculators, search/filter, audit modal & CSV export
└── README.md        # Comprehensive documentation, test verification log, and user guide
```

---

## 🧠 Question Dataset & Faculty Answer Key

All 30 questions were extracted verbatim from `5th_Sem_CSE_Placement_Quiz_30_Questions.docx`:

| # | Topic / Domain | Question Summary | Faculty Answer | Key Text |
|---|---|---|---|---|
| **1** | Data Structures | Data structure following LIFO principle | **B** | Stack |
| **2** | Algorithms & Complexity | Time complexity of binary search on sorted array | **B** | O(log n) |
| **3** | Object-Oriented Programming | Same method name with different parameter lists | **C** | Method overloading |
| **4** | Java Programming | Java keyword used to inherit a class | **B** | extends |
| **5** | Java Programming | Output of `System.out.println(7 / 2);` | **B** | 3 |
| **6** | Database Management Systems | SQL command to retrieve data from a table | **C** | SELECT |
| **7** | Database Management Systems | Normal form primarily removing partial dependency | **B** | 2NF |
| **8** | Operating Systems | OS component deciding CPU time allocation | **B** | Scheduler |
| **9** | Operating Systems | Deadlock condition in operating systems | **B** | Circular wait |
| **10** | Computer Networks | Protocol used to securely browse websites | **C** | HTTPS |
| **11** | Computer Networks | Device forwarding packets between different networks | **C** | Router |
| **12** | Computer Networks | Primary function of DNS | **B** | Maps domain names to IP addresses |
| **13** | Web Development | HTML tag creating a hyperlink | **B** | `<a>` |
| **14** | Web Development | CSS property changing text color | **C** | color |
| **15** | Java Programming | Java collection that does not allow duplicate elements | **C** | HashSet |
| **16** | Java Programming | Java keyword preventing a class from being inherited | **B** | final |
| **17** | Digital Logic & Programming | Result of `5 & 3` using bitwise AND | **A** | 1 |
| **18** | Data Structures & Algorithms | BST traversal visiting keys in sorted order | **C** | Inorder |
| **19** | Algorithms & Complexity | Technique solving problems by combining subproblem solutions | **B** | Divide and conquer |
| **20** | Database Management Systems | Primary key constraints in DBMS | **B** | Unique and non-null |
| **21** | Software Engineering | SDLC model following repeated short development cycles | **B** | Agile |
| **22** | Software Engineering & Testing | Main purpose of a unit test in software testing | **B** | An individual component or function |
| **23** | Version Control & Tools | Git command creating local copy of remote repo | **B** | git clone |
| **24** | Data Structures & Algorithms | Data structure commonly used for BFS | **B** | Queue |
| **25** | Software Architecture | Full form of API | **A** | Application Programming Interface |
| **26** | Computer Networks & Web | HTTP status code meaning 'Not Found' | **C** | 404 |
| **27** | Machine Learning & AI | ML learning type using labeled examples | **B** | Supervised learning |
| **28** | Database Management Systems | SQL clause filtering rows before grouping | **C** | WHERE |
| **29** | Computer Organization | Number system used internally at basic logic level | **B** | Binary |
| **30** | Cybersecurity | Most effective practice for password-based account protection | **C** | Use unique strong password & enable MFA |

---

## 📊 Marking Scheme & Performance Bands

- **Total Questions**: 30 MCQs
- **Total Marks**: 30 Marks (Each correct answer: `+1 Mark`)
- **Negative Marking**: None (`0 Marks` for incorrect or unanswered questions)
- **Percentage Formula**: $\text{Percentage} = \left(\frac{\text{Score}}{30}\right) \times 100$

### Performance Verdict Criteria
- **27 – 30 Marks**: `🏆 Excellent — Placement Ready`
- **23 – 26 Marks**: `🌟 Very Good`
- **18 – 22 Marks**: `👍 Good — Keep Practising`
- **12 – 17 Marks**: `⚠️ Needs Improvement`
- **0 – 11 Marks**: `📚 More Practice Recommended`
- **Proctoring Violation**: `⚠️ Disqualified — Tab Switch Violation`

---

## ⚡ Keyboard Shortcuts

| Key | Action |
|---|---|
| <kbd>1</kbd> or <kbd>A</kbd> | Select **Option A** |
| <kbd>2</kbd> or <kbd>B</kbd> | Select **Option B** |
| <kbd>3</kbd> or <kbd>C</kbd> | Select **Option C** |
| <kbd>4</kbd> or <kbd>D</kbd> | Select **Option D** |
| <kbd>&larr;</kbd> (Left Arrow) or <kbd>P</kbd> | Navigate to **Previous Question** |
| <kbd>&rarr;</kbd> (Right Arrow) or <kbd>N</kbd> | Navigate to **Next Question** / Review |

---

## 🧪 Verification & Automated Test Results

All automated validation tests completed successfully:
```text
==================================================
CSE PLACEMENT QUIZ ARENA - COMPREHENSIVE AUDIT
==================================================
Total questions found: 30
[PASS] questions.js: All 30 questions, 4 options each, 100% faculty answer key match!
Total script.js DOM element lookups: 93
[PASS] index.html: All DOM element IDs referenced in script.js exist!
[PASS] index.html: Clean student portal verified, zero admin links or forms!
Total admin.js DOM element lookups: 44
[PASS] admin.html: All DOM element IDs referenced in admin.js exist!
[PASS] LocalStorage keys synchronized between student portal and admin console!
[PASS] Mobile optimization and Proctoring features confirmed!
==================================================
ALL VERIFICATION CHECKS PASSED (100% GREEN)
==================================================
```

---

## 🎓 Faculty Information

- **Institution**: VTU Affiliated Engineering Institution
- **Department**: Computer Science & Engineering (CSE)
- **Target Semester**: 5th Semester
- **Activity**: Student Forum Placement Training Assessment
- **Year**: 2026
