import os, uuid, re
from datetime import datetime, timezone
from pymongo import MongoClient

db = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))[os.environ.get("DB_NAME", "test_database")]
def nid(): return str(uuid.uuid4())
def now(): return datetime.now(timezone.utc).isoformat()
def slug(t): return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')
def mod(name, topics, practical=None):
    ts = list(topics)
    if practical: ts.append("Practical: " + "; ".join(practical))
    return {"module": name, "topics": ts}

COURSES = [
 {"name":"AWS & DevOps","category":"Cloud Computing / DevOps","level":"Advanced","duration":"5 Months",
  "tools":["AWS","EC2","VPC","S3","RDS","Route53","CloudFront","CloudWatch","CloudTrail","IAM","Linux","Git","GitHub","Jenkins","Maven","Docker","Terraform","Ansible","Kubernetes"],
  "outcomes":["Deploy & manage scalable AWS infrastructure","Build end-to-end CI/CD pipelines","Containerize & orchestrate apps with Docker & Kubernetes","Automate infra with Terraform & Ansible"],
  "careers":["DevOps Engineer","Cloud Engineer","AWS Solutions Architect","Site Reliability Engineer"],
  "syllabus":[
    mod("Module 1 – Linux Fundamentals",["Linux intro & distributions","File system, files & directories","pwd/ls/cd, mkdir/touch/cp/mv/rm","cat/less/head/tail, grep/find","chmod/chown, users & groups","processes ps/top/kill","package management apt/yum","environment variables & shell basics"],["Create users, configure permissions, manage processes, install packages, write shell scripts"]),
    mod("Module 2 – Linux Shell Scripting",["Variables & data types","Input/output","if/else, case","for & while loops","functions, arguments, exit status","cron jobs & automation"],["Server monitoring, backup & log-cleanup scripts"]),
    mod("Module 3 – Networking Fundamentals",["IP address IPv4/IPv6, public/private","DNS, DHCP","TCP/IP, TCP vs UDP","HTTP/HTTPS, ports","SSH, FTP/SFTP","Firewalls, CIDR & subnetting","Routing & load balancing"]),
    mod("Module 4 – AWS Fundamentals",["Cloud computing, IaaS/PaaS/SaaS","Public/Private/Hybrid cloud","Global infra: Regions & AZs","AWS Console & CLI","IAM fundamentals & account security","AWS pricing basics"]),
    mod("Module 5 – AWS IAM",["Users, groups, roles","Managed & inline policies","Least privilege, MFA","Access keys & best practices"],["Create IAM users, custom policies, roles & MFA"]),
    mod("Module 6 – AWS EC2",["AMI, instance types, key pairs","Security groups, EBS, Elastic IP","User data, instance lifecycle","SSH connection, monitoring"],["Launch EC2, configure SG, SSH & deploy an app"]),
    mod("Module 7 – AWS VPC",["VPC architecture & CIDR","Public/private subnets, route tables","Internet & NAT Gateway","Security Groups, Network ACL","VPC peering & endpoints"],["Create custom VPC, subnets & routing"]),
    mod("Module 8 – AWS S3",["Buckets, objects, storage classes","Bucket policies & IAM permissions","Versioning, lifecycle rules","Encryption, static website hosting"],["Create bucket, upload files, host static site"]),
    mod("Module 9 – AWS Route 53",["Hosted zones & record types","A, CNAME, Alias","Domain configuration","Health checks & routing policies"],["Connect a domain & configure DNS"]),
    mod("Module 10 – AWS CloudFront",["CDN fundamentals & distributions","Origin & cache behavior","HTTPS & SSL certificates","Cache invalidation"],["Deploy website using S3 + CloudFront"]),
    mod("Module 11 – AWS RDS",["RDS architecture, MySQL/PostgreSQL","DB instances & security groups","Backups & snapshots","Multi-AZ & read replicas"],["Create RDS & connect an app"]),
    mod("Module 12 – AWS CloudWatch",["Metrics, logs, alarms","Dashboards, EC2 & app monitoring"],["Create alarm & monitor EC2"]),
    mod("Module 13 – AWS CloudTrail",["API activity & event history","Audit logging & security monitoring"]),
    mod("Module 14 – AWS SNS",["Topics & subscribers","Email & application notifications","CloudWatch integration"]),
    mod("Module 15 – Git & GitHub",["init/clone/add/commit/push/pull","branch/merge/rebase/stash/tags","GitHub, Pull Requests","merge conflicts, .gitignore"],["Create repo, branching & PR workflow"]),
    mod("Module 16 – Maven",["pom.xml, dependencies, plugins","lifecycle: build/test/package/install","project structure"]),
    mod("Module 17 – Jenkins",["CI/CD fundamentals, installation & architecture","Freestyle & Pipeline jobs, Jenkinsfile","Build triggers, GitHub webhooks","Credentials, agents, stages, post actions"],["Create CI pipeline with GitHub + automated build/test"]),
    mod("Module 18 – Docker",["Containers & architecture","Images, Dockerfile, commands","Docker Hub, volumes, networks","Docker Compose"],["Dockerize app, build image, push to Docker Hub"]),
    mod("Module 19 – Terraform",["Infrastructure as Code","Providers, resources, variables, outputs","State & modules","init/plan/apply/destroy, remote state"],["Create AWS infrastructure with Terraform"]),
    mod("Module 20 – Ansible",["Configuration management & architecture","Inventory, playbooks, tasks","Variables, handlers, roles, modules, YAML"],["Configure EC2 & auto-install software"]),
    mod("Module 21 – Kubernetes",["Architecture: control plane & nodes","Pods, Deployments, Services, ReplicaSets","ConfigMaps, Secrets, Namespaces, Volumes","Ingress, scaling, rolling updates"],["Minikube: deploy, expose service & scale app"]),
    mod("Real-World Project – End-to-End DevOps CI/CD on AWS",["GitHub → Jenkins → Maven → Docker → Docker Hub → AWS EC2 → Kubernetes","Complete automated build, test & deploy pipeline"]),
  ]},
 {"name":"Selenium Java Automation Testing","category":"Software Testing","level":"Intermediate","duration":"4 Months",
  "tools":["Java","Selenium","WebDriver","TestNG","Maven","POM","Apache POI","ExtentReports","Git","GitHub","Jenkins","Rest Assured","API Testing"],
  "outcomes":["Build automation frameworks from scratch","Master Selenium WebDriver & TestNG","Data-driven testing with Apache POI","API automation with Rest Assured"],
  "careers":["Automation Test Engineer","SDET","QA Engineer","Test Automation Lead"],
  "syllabus":[
    mod("Module 1 – Software Testing Fundamentals",["SDLC & STLC","Manual vs automation testing","Test case, scenario & bug lifecycle","Severity vs priority","Regression, smoke, sanity","Functional & non-functional testing"]),
    mod("Module 2 – Core Java",["Variables, data types, operators","Conditions, loops, arrays, strings","Methods, constructors, classes, objects","Inheritance, polymorphism, encapsulation, abstraction","Interfaces & exception handling","Collections: List/Set/Map, file handling"]),
    mod("Module 3 – Selenium Fundamentals",["Selenium WebDriver intro","Browser drivers: Chrome/Firefox/Edge","WebDriver commands & navigation","Web elements & locators"]),
    mod("Module 4 – Selenium Locators",["ID, Name, Class, Tag","Link & Partial Link Text","CSS Selector, XPath","Relative XPath, functions & axes"],["Build locator strategies for real websites"]),
    mod("Module 5 – WebElement Automation",["click/sendKeys/clear","getText/getAttribute","isDisplayed/isEnabled/isSelected","checkbox, radio, dropdown, multi-select"]),
    mod("Module 6 – Selenium Waits",["Implicit, explicit & fluent wait","ExpectedConditions","Synchronization problems"]),
    mod("Module 7 – Advanced Selenium",["Alerts, frames, windows, tabs","Actions class: mouse & keyboard","JavaScriptExecutor & scrolling","Screenshots, file upload, cookies, browser options"]),
    mod("Module 8 – TestNG",["Annotations & assertions","Groups, parameters, DataProvider","Test dependency & parallel execution","testng.xml"]),
    mod("Module 9 – Page Object Model",["POM architecture & page classes","PageFactory & reusable methods","Base & utility classes, config management"]),
    mod("Module 10 – Data-Driven Testing",["Excel with Apache POI","CSV, JSON, properties files","DataProvider & external test data"]),
    mod("Module 11 – Maven",["pom.xml, dependencies, plugins","lifecycle & test execution"]),
    mod("Module 12 – Automation Framework",["Java + Selenium + TestNG + Maven + POM","Utilities, config, logging","Screenshots, Excel, Extent Reports"]),
    mod("Module 13 – Extent Reports",["Test reports & screenshots","Pass/fail status, logs, HTML reports"]),
    mod("Module 14 – Git & GitHub",["init/commit/push/pull","branches, merge, Pull Requests"]),
    mod("Module 15 – Jenkins CI",["Installation & Maven integration","GitHub integration & pipeline","Scheduled & automated test execution"]),
    mod("Module 16 – API Automation",["REST & HTTP methods GET/POST/PUT/PATCH/DELETE","Headers, params, authentication","JSON & response validation","Rest Assured & API assertions"]),
    mod("Real-Time Project – Enterprise Automation Framework",["E-commerce/banking app automation","Java, Selenium, TestNG, Maven, POM","Apache POI, ExtentReports, GitHub, Jenkins"]),
  ]},
 {"name":"Cyber Security","category":"Cyber Security","level":"Beginner to Advanced","duration":"5 Months",
  "tools":["Linux","Networking","OWASP","Kali Linux","Nmap","Wireshark","Burp Suite","OWASP ZAP","Metasploit","Cloud Security"],
  "outcomes":["Understand core security & the CIA triad","Perform authorized vulnerability assessments","Apply OWASP Top 10 defensive practices","Security monitoring & incident response"],
  "careers":["Security Analyst","SOC Analyst","Penetration Tester (authorized)","Cloud Security Engineer"],
  "syllabus":[
    mod("Module 1 – Cyber Security Fundamentals",["CIA Triad","Threat, vulnerability, risk, attack","Security controls & policies"]),
    mod("Module 2 – Networking for Security",["OSI model & TCP/IP","IP, ports, protocols","DNS, HTTP/HTTPS, TCP/UDP","Firewalls, VPN, proxy, NAT"]),
    mod("Module 3 – Linux Security",["Users, groups, permissions","Processes, services, logs","SSH & firewall configuration"]),
    mod("Module 4 – Cryptography",["Symmetric & asymmetric encryption","Hashing & digital signatures","Certificates, SSL/TLS","AES, RSA, SHA"]),
    mod("Module 5 – Web Security",["Authentication & authorization","Session management","Input validation & secure coding","HTTPS"]),
    mod("Module 6 – OWASP Top 10",["Broken Access Control, Cryptographic Failures","Injection, Insecure Design","Security Misconfiguration, Vulnerable Components","Authentication & Integrity Failures","Logging/Monitoring Failures, SSRF"]),
    mod("Module 7 – Ethical Hacking Fundamentals",["Reconnaissance, scanning, enumeration","Vulnerability assessment","Exploitation & post-exploitation concepts","Reporting"]),
    mod("Module 8 – Security Tools (Authorized Labs Only)",["Kali Linux, Nmap, Wireshark","Burp Suite, OWASP ZAP, Metasploit","All exercises on authorized lab systems only"]),
    mod("Module 9 – Network Security",["Firewall, IDS, IPS, VPN","Network monitoring","Security architecture & Zero Trust"]),
    mod("Module 10 – Cloud Security",["AWS security fundamentals & IAM","Security groups & Network ACL","Encryption, CloudTrail, CloudWatch","Secrets management & least privilege"]),
    mod("Module 11 – Security Monitoring",["Logs & SIEM fundamentals","Security alerts & incident detection","Incident response"]),
    mod("Project – Web Application Security Assessment Lab",["Recon → Vulnerability Assessment → OWASP Testing","Findings → Risk Classification → Remediation → Final Report"]),
  ]},
 {"name":"Agentic AI","category":"Artificial Intelligence","level":"Intermediate to Advanced","duration":"4 Months",
  "tools":["Python","LLM","Prompt Engineering","AI Agents","RAG","Vector Database","Embeddings","LangChain","LangGraph","LlamaIndex","Tool Calling","MCP"],
  "outcomes":["Design & build autonomous AI agents","Implement RAG with vector databases","Master tool calling & multi-agent systems","Apply AI safety & evaluation practices"],
  "careers":["AI Engineer","AI Agent Developer","LLM Application Developer","Automation Engineer"],
  "syllabus":[
    mod("Module 1 – AI Fundamentals",["AI & ML overview","Generative AI & LLMs","AI applications & limitations"]),
    mod("Module 2 – Generative AI",["Tokens & context window","Prompt & temperature","Model parameters, text generation"]),
    mod("Module 3 – Prompt Engineering",["Role & context prompting","Few-shot & chain-of-thought","Structured outputs & templates","Prompt evaluation"]),
    mod("Module 4 – LLM APIs",["API keys & authentication","Request/response, JSON","Model selection & error handling","Rate limits & cost management"]),
    mod("Module 5 – AI Agents",["Agent architecture & goals","Planning & reasoning","Tools, memory, actions","Feedback loops & orchestration"]),
    mod("Module 6 – Tool Calling",["Function calling & tool definitions","External, database, search & file tools","API automation"]),
    mod("Module 7 – Agent Memory",["Short & long-term memory","Conversation & context management","Vector databases, embeddings, semantic search"]),
    mod("Module 8 – RAG",["Document ingestion & chunking","Embeddings & vector DB","Retrieval & context injection","Response generation & evaluation"]),
    mod("Module 9 – Multi-Agent Systems",["Agent roles & communication","Task delegation & supervisor agents","Parallel, sequential & collaborative agents"]),
    mod("Module 10 – AI Agent Frameworks",["LangChain, LangGraph, LlamaIndex","Production-ready agent frameworks"]),
    mod("Module 11 – AI Automation",["Workflow, browser & API automation","Database & email automation","Document processing & data extraction"]),
    mod("Module 12 – Agentic AI with Python",["API integration & JSON","HTTP requests & env variables","Async basics, building agents"]),
    mod("Module 13 – AI Safety",["Prompt injection & data leakage","Hallucination & tool misuse","Access control, human approval, guardrails","Responsible AI"]),
    mod("Module 14 – Agent Evaluation",["Accuracy, reliability, latency, cost","Tool success rate & hallucination detection","Evaluation datasets & monitoring"]),
    mod("Project – AI Training Institute Assistant",["Answer student questions & recommend courses","Retrieve syllabus & batch info, answer FAQs","Collect enquiries, maintain context, escalate to admin"]),
  ]},
 {"name":"Claude AI","category":"Artificial Intelligence","level":"Beginner to Advanced","duration":"3 Months",
  "tools":["Claude","Prompt Engineering","Claude API","Tool Use","MCP","Agentic AI","Coding","Testing","DevOps","Automation"],
  "outcomes":["Master Claude for coding, testing & docs","Use the Claude API & tool calling","Connect Claude to systems via MCP","Build AI-assisted automation workflows"],
  "careers":["AI Automation Engineer","AI-Assisted Developer","AI QA Engineer","Prompt Engineer"],
  "syllabus":[
    mod("Module 1 – Claude AI Fundamentals",["Intro to Claude & LLM concepts","Capabilities, use cases & limitations"]),
    mod("Module 2 – Claude Prompt Engineering",["System instructions & role definition","Context & few-shot prompting","Output formatting & optimization"]),
    mod("Module 3 – Claude for Coding",["Code generation & explanation","Code review & debugging","Refactoring, test & doc generation"]),
    mod("Module 4 – Claude for Software Testing",["Test case & scenario generation","Selenium & Playwright code generation","API test generation & bug analysis","Test data generation"]),
    mod("Module 5 – Claude for Documentation",["Technical docs & requirements","User stories & API documentation","README & project documentation"]),
    mod("Module 6 – Claude for Data Analysis",["CSV & Excel analysis","Data cleaning & summarization","Trend analysis & report generation"]),
    mod("Module 7 – Claude with Files",["PDF, text & CSV analysis","Extracting & summarizing info","Comparing documents"]),
    mod("Module 8 – Claude API",["Authentication, requests & responses","JSON & model configuration","Tokens, error handling, rate limits, cost"]),
    mod("Module 9 – Claude Tool Use",["Function & tool calling","External APIs & custom tools","Database integration & workflows"]),
    mod("Module 10 – Claude + MCP",["Model Context Protocol fundamentals","MCP servers, tools & resources","Connecting AI to external systems"]),
    mod("Module 11 – Claude + Agentic AI",["Claude as an agent: planning & tools","Memory & multi-step workflows","Human-in-the-loop automation"]),
    mod("Module 12 – Claude for DevOps",["Shell scripting & Dockerfile generation","Kubernetes YAML & Terraform","Ansible playbooks & CI/CD assistance","Log analysis"]),
    mod("Module 13 – Claude for Cyber Security (Defensive)",["Security & log analysis","Secure coding & OWASP concepts","Defensive security automation only"]),
    mod("Module 14 – Claude + Automation",["Browser, API & test automation","Data extraction & workflow automation"]),
    mod("Project – AI-Powered Software Testing Assistant",["Generate test scenarios & cases","Selenium Java & Playwright code","API tests, bug reports & test data"]),
  ]},
]

FEES = {"AWS & DevOps":(60000,45000),"Selenium Java Automation Testing":(45000,32000),"Cyber Security":(65000,48000),"Agentic AI":(70000,52000),"Claude AI":(40000,29000)}
added=0
for i,c in enumerate(COURSES):
    if db.courses.find_one({"name":c["name"]}):
        continue
    fee,disc=FEES[c["name"]]
    db.courses.insert_one({
        "id":nid(),"slug":slug(c["name"]),"name":c["name"],"category":c["category"],
        "short_description":f"Industry-ready {c['name']} training with hands-on labs, real-world projects and placement support.",
        "full_description":f"Master {c['name']} through live instructor-led sessions covering {len(c['syllabus'])} structured modules, practical labs and a capstone real-world project. Includes interview preparation, certification guidance and dedicated placement assistance.",
        "image_url":"","duration":c["duration"],"level":c["level"],"mode":"Online / Classroom",
        "fee":fee,"discounted_fee":disc,"certification":"CloudWave Certified "+c["name"],
        "prerequisites":"Basic computer knowledge. Fundamentals are covered from scratch.",
        "learning_outcomes":c["outcomes"],"career_opportunities":c["careers"],"tools":c["tools"],
        "syllabus":c["syllabus"],"featured":True,"published":True,"sort_order":100+i,
        "created_at":now(),"updated_at":now()})
    added+=1
print("added",added,"total courses",db.courses.count_documents({}))
