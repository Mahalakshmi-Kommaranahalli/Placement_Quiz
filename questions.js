/**
 * 5th Semester CSE Placement Quiz - Question Bank & Answer Key
 * Extracted directly from 5th_Sem_CSE_Placement_Quiz_30_Questions.docx
 */
const QUIZ_QUESTIONS = [
  {
    "id": 1,
    "question": "Which data structure follows the LIFO principle?",
    "options": {
      "A": "Queue",
      "B": "Stack",
      "C": "Linked list",
      "D": "Tree"
    },
    "correctAnswer": "B",
    "category": "Data Structures",
    "explanation": "A Stack operates on the Last-In, First-Out (LIFO) principle, where the most recently pushed element is the first to be popped. A Queue follows First-In, First-Out (FIFO)."
  },
  {
    "id": 2,
    "question": "What is the time complexity of binary search on a sorted array?",
    "options": {
      "A": "O(n)",
      "B": "O(log n)",
      "C": "O(n log n)",
      "D": "O(1) in every case"
    },
    "correctAnswer": "B",
    "category": "Algorithms & Complexity",
    "explanation": "Binary search divides the search space in half with every comparison on a sorted array, yielding a logarithmic time complexity of O(log n)."
  },
  {
    "id": 3,
    "question": "Which OOP concept allows the same method name to have different parameter lists?",
    "options": {
      "A": "Inheritance",
      "B": "Encapsulation",
      "C": "Method overloading",
      "D": "Abstraction"
    },
    "correctAnswer": "C",
    "category": "Object-Oriented Programming",
    "explanation": "Method overloading is a form of compile-time polymorphism where multiple methods within the same class share identical names but have different parameter counts, types, or order."
  },
  {
    "id": 4,
    "question": "In Java, which keyword is used to inherit a class?",
    "options": {
      "A": "implements",
      "B": "extends",
      "C": "inherits",
      "D": "super"
    },
    "correctAnswer": "B",
    "category": "Java Programming",
    "explanation": "In Java, the extends keyword establishes inheritance between a subclass and its superclass. The implements keyword is used to implement interfaces."
  },
  {
    "id": 5,
    "question": "What is the output of System.out.println(7 / 2); in Java?",
    "options": {
      "A": "3.5",
      "B": "3",
      "C": "4",
      "D": "Compilation error"
    },
    "correctAnswer": "B",
    "category": "Java Programming",
    "explanation": "Both operands 7 and 2 are integer literals. In Java, integer division truncates any fractional portion, returning 3 instead of 3.5."
  },
  {
    "id": 6,
    "question": "Which SQL command retrieves data from a table?",
    "options": {
      "A": "GET",
      "B": "OPEN",
      "C": "SELECT",
      "D": "FETCH TABLE"
    },
    "correctAnswer": "C",
    "category": "Database Management Systems",
    "explanation": "The SQL SELECT statement is the Data Query Language (DQL) command used to query and extract rows and columns from database tables."
  },
  {
    "id": 7,
    "question": "Which normal form primarily removes partial dependency?",
    "options": {
      "A": "1NF",
      "B": "2NF",
      "C": "3NF",
      "D": "BCNF"
    },
    "correctAnswer": "B",
    "category": "Database Management Systems",
    "explanation": "Second Normal Form (2NF) mandates that the table is in 1NF and that all non-prime attributes are fully functionally dependent on the primary key, eliminating partial dependencies."
  },
  {
    "id": 8,
    "question": "Which OS component decides which process gets CPU time?",
    "options": {
      "A": "Compiler",
      "B": "Scheduler",
      "C": "Linker",
      "D": "Loader"
    },
    "correctAnswer": "B",
    "category": "Operating Systems",
    "explanation": "The CPU Scheduler (short-term scheduler) selects a ready process from memory and allocates the CPU according to its scheduling algorithm."
  },
  {
    "id": 9,
    "question": "Which of the following is a deadlock condition in operating systems?",
    "options": {
      "A": "Preemption",
      "B": "Circular wait",
      "C": "Compilation",
      "D": "Paging"
    },
    "correctAnswer": "B",
    "category": "Operating Systems",
    "explanation": "Circular wait is one of the four necessary Coffman conditions for deadlock (alongside Mutual Exclusion, Hold and Wait, and No Preemption)."
  },
  {
    "id": 10,
    "question": "Which protocol is used to securely browse websites?",
    "options": {
      "A": "FTP",
      "B": "HTTP",
      "C": "HTTPS",
      "D": "SMTP"
    },
    "correctAnswer": "C",
    "category": "Computer Networks",
    "explanation": "HTTPS (Hypertext Transfer Protocol Secure) encrypts web traffic using Transport Layer Security (TLS/SSL) to protect sensitive communications from eavesdropping and tampering."
  },
  {
    "id": 11,
    "question": "Which device forwards packets between different networks?",
    "options": {
      "A": "Hub",
      "B": "Switch",
      "C": "Router",
      "D": "Repeater"
    },
    "correctAnswer": "C",
    "category": "Computer Networks",
    "explanation": "A router operates at Layer 3 (Network Layer) of the OSI model and inspects destination IP addresses to forward packets across different networks and subnets."
  },
  {
    "id": 12,
    "question": "What does DNS primarily do?",
    "options": {
      "A": "Encrypts files",
      "B": "Maps domain names to IP addresses",
      "C": "Assigns CPU time",
      "D": "Compresses webpages"
    },
    "correctAnswer": "B",
    "category": "Computer Networks",
    "explanation": "The Domain Name System (DNS) resolves human-readable domain names (such as www.example.com) into numerical IP addresses needed by networking hardware."
  },
  {
    "id": 13,
    "question": "Which HTML tag creates a hyperlink?",
    "options": {
      "A": "<link>",
      "B": "<a>",
      "C": "<href>",
      "D": "<url>"
    },
    "correctAnswer": "B",
    "category": "Web Development",
    "explanation": "The anchor tag <a> with the href attribute creates hyperlinks on web pages. <link> is used to link external resources such as stylesheets in the <head>."
  },
  {
    "id": 14,
    "question": "Which CSS property changes the text color?",
    "options": {
      "A": "font-style",
      "B": "background-color",
      "C": "color",
      "D": "text-align"
    },
    "correctAnswer": "C",
    "category": "Web Development",
    "explanation": "The CSS color property specifies the foreground color of text. \background-color changes element backgrounds, and \font-style sets italic or normal style."
  },
  {
    "id": 15,
    "question": "Which Java collection does not allow duplicate elements?",
    "options": {
      "A": "ArrayList",
      "B": "LinkedList",
      "C": "HashSet",
      "D": "Vector"
    },
    "correctAnswer": "C",
    "category": "Java Programming",
    "explanation": "HashSet implements the Set interface, which by definition contains no duplicate elements and relies on hashCode() and equals() to enforce uniqueness."
  },
  {
    "id": 16,
    "question": "Which Java keyword prevents a class from being inherited?",
    "options": {
      "A": "static",
      "B": "final",
      "C": "private",
      "D": "const"
    },
    "correctAnswer": "B",
    "category": "Java Programming",
    "explanation": "Declaring a Java class as \final (e.g., \final class SecurityManager) prevents any other class from extending or inheriting from it."
  },
  {
    "id": 17,
    "question": "What is the result of 5 & 3 using bitwise AND?",
    "options": {
      "A": "1",
      "B": "2",
      "C": "7",
      "D": "8"
    },
    "correctAnswer": "A",
    "category": "Digital Logic & Programming",
    "explanation": "Converting to binary: 5 is 101\u2082 and 3 is 011\u2082. Performing bitwise AND: 101 & 011 = 001\u2082, which equals decimal 1."
  },
  {
    "id": 18,
    "question": "Which traversal of a binary search tree visits keys in sorted order?",
    "options": {
      "A": "Preorder",
      "B": "Postorder",
      "C": "Inorder",
      "D": "Level order"
    },
    "correctAnswer": "C",
    "category": "Data Structures & Algorithms",
    "explanation": "In-order traversal visits the left subtree, current node, and right subtree (Left-Root-Right). For a BST, this always processes nodes in non-decreasing sorted order."
  },
  {
    "id": 19,
    "question": "Which algorithm design technique solves problems by combining solutions to smaller subproblems?",
    "options": {
      "A": "Brute force only",
      "B": "Divide and conquer",
      "C": "Random guessing",
      "D": "Linear probing"
    },
    "correctAnswer": "B",
    "category": "Algorithms & Complexity",
    "explanation": "Divide and Conquer divides a problem into independent subproblems of the same type, solves them recursively, and combines the results (e.g., Merge Sort, Binary Search)."
  },
  {
    "id": 20,
    "question": "In DBMS, a primary key must be:",
    "options": {
      "A": "Nullable and repeated",
      "B": "Unique and non-null",
      "C": "Always a string",
      "D": "A foreign key in every table"
    },
    "correctAnswer": "B",
    "category": "Database Management Systems",
    "explanation": "According to the Entity Integrity Constraint in relational databases, every primary key attribute must contain unique values and cannot contain NULL."
  },
  {
    "id": 21,
    "question": "Which SDLC model follows repeated short development cycles?",
    "options": {
      "A": "Waterfall only",
      "B": "Agile",
      "C": "Big Bang only",
      "D": "V-model only"
    },
    "correctAnswer": "B",
    "category": "Software Engineering",
    "explanation": "Agile development methodologies (like Scrum and Kanban) break projects into short, iterative cycles or sprints, facilitating regular inspection and adaptation."
  },
  {
    "id": 22,
    "question": "In software testing, what is a unit test mainly used to test?",
    "options": {
      "A": "The complete deployed system only",
      "B": "An individual component or function",
      "C": "Network bandwidth",
      "D": "User permissions only"
    },
    "correctAnswer": "B",
    "category": "Software Engineering & Testing",
    "explanation": "Unit tests isolate and verify the correctness of the smallest testable units of software source code, such as individual methods, functions, or procedures."
  },
  {
    "id": 23,
    "question": "Which Git command creates a local copy of a remote repository?",
    "options": {
      "A": "git push",
      "B": "git clone",
      "C": "git commit",
      "D": "git status"
    },
    "correctAnswer": "B",
    "category": "Version Control & Tools",
    "explanation": "git clone downloads an existing remote Git repository to the local machine, configuring remote tracking branches and checking out the default branch."
  },
  {
    "id": 24,
    "question": "Which data structure is commonly used for breadth-first search?",
    "options": {
      "A": "Stack",
      "B": "Queue",
      "C": "Heap",
      "D": "Hash map only"
    },
    "correctAnswer": "B",
    "category": "Data Structures & Algorithms",
    "explanation": "Breadth-First Search (BFS) explores all neighbors at the present depth before moving deeper, requiring a First-In, First-Out (FIFO) Queue."
  },
  {
    "id": 25,
    "question": "What does API stand for?",
    "options": {
      "A": "Application Programming Interface",
      "B": "Applied Program Internet",
      "C": "Automated Process Integration",
      "D": "Application Process Instruction"
    },
    "correctAnswer": "A",
    "category": "Software Architecture",
    "explanation": "API stands for Application Programming Interface, which provides a set of defined rules and protocols allowing different software components to interact."
  },
  {
    "id": 26,
    "question": "Which HTTP status code commonly means 'Not Found'?",
    "options": {
      "A": "200",
      "B": "301",
      "C": "404",
      "D": "500"
    },
    "correctAnswer": "C",
    "category": "Computer Networks & Web",
    "explanation": "HTTP 404 Not Found is a standard client error response code indicating that the server cannot locate the requested URI resource."
  },
  {
    "id": 27,
    "question": "In machine learning, which type of learning uses labeled examples?",
    "options": {
      "A": "Unsupervised learning",
      "B": "Supervised learning",
      "C": "Reinforcement learning only",
      "D": "Random learning"
    },
    "correctAnswer": "B",
    "category": "Machine Learning & AI",
    "explanation": "Supervised learning algorithms are trained using labeled datasets where the desired output (ground truth) is provided for each training instance."
  },
  {
    "id": 28,
    "question": "Which SQL clause filters rows before grouping?",
    "options": {
      "A": "ORDER BY",
      "B": "HAVING",
      "C": "WHERE",
      "D": "GROUP BY"
    },
    "correctAnswer": "C",
    "category": "Database Management Systems",
    "explanation": "In SQL query processing, WHERE evaluates conditions and filters individual rows before any GROUP BY aggregation. HAVING filters aggregated groups after grouping."
  },
  {
    "id": 29,
    "question": "Which number system is used internally by digital computers at the basic logic level?",
    "options": {
      "A": "Decimal",
      "B": "Binary",
      "C": "Roman",
      "D": "Base 12"
    },
    "correctAnswer": "B",
    "category": "Computer Organization",
    "explanation": "Digital computers operate using binary (base 2, consisting of 0s and 1s) because physical transistor switches reliably represent two distinct electronic voltage states (on/off)."
  },
  {
    "id": 30,
    "question": "Which practice is most effective for protecting a password-based account?",
    "options": {
      "A": "Reuse one password everywhere",
      "B": "Share passwords with friends",
      "C": "Use a unique strong password and enable MFA",
      "D": "Keep passwords in public notes"
    },
    "correctAnswer": "C",
    "category": "Cybersecurity",
    "explanation": "Using unique, complex passwords prevents credential stuffing attacks across sites, and Multi-Factor Authentication (MFA) requires a secondary verification method even if passwords leak."
  }
];
