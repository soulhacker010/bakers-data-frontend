# ABA Data Collection Platform - Complete Build Plan frontend

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [UI Design System](#ui-design-system)
4. [Page-by-Page UI Specifications](#page-by-page-ui-specifications)
5. [Implementation Steps](#implementation-steps)
6. [Deployment Guide](#deployment-guide)


## 1. Project Overview

### What We're Building
A web-based ABA (Applied Behavior Analysis) therapy data collection platform that allows therapists to:
- Manage client profiles
- Create custom therapy programs (skills and behaviors)
- Collect real-time data during therapy sessions
- Track progress over time with visual graphs
- Generate session reports

### User Story
**As a therapist**, I need to:
1. Log into the platform
2. Select a client I'm working with
3. Start a therapy session
4. Quickly record data as the child performs tasks (correct/incorrect responses, behaviors, prompts needed)
5. See immediate feedback and statistics
6. End the session and save all data
7. View progress graphs showing how the child is improving over time

### Core Features (MVP)
- ✅ User authentication (login/logout)
- ✅ Client management (add, edit, view clients)
- ✅ Program management (create skill and behavior programs)
- ✅ Real-time session data collection with multiple data types:
  - Trial-based (correct/incorrect with prompt levels)
  - Frequency counting
  - Duration timing
- ✅ Session history and notes
- ✅ Progress visualization (graphs/charts)
- ✅ Data export (CSV)
- ✅ Responsive design (works on tablets and desktops)


### Frontend
- **Framework:** React 18+ with Vite
- **Language:** JavaScript/TypeScript (TypeScript recommended for type safety)
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** React Context API + useState/useReducer
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Forms:** React Hook Form + Zod validation

### Development Tools
- **Frontend Dev Server:** Vite


### 3. UI Design System
Color Palette

> ⚠️ **BRAND COLORS - DO NOT CHANGE WITHOUT CLIENT APPROVAL**

```css
/* ========================================
   OFFICIAL CLIENT BRAND COLORS
   Updated: January 2026
   ======================================== */

/* Primary Color - Teal */
--primary: #159DB3;          /* Main brand color - buttons, links, accents */
--primary-light: #E0F4F7;    /* Light backgrounds, hover states */
--primary-dark: #0E8499;     /* Hover states for buttons */
--primary-rgb: 21, 157, 179; /* For rgba() usage */

/* Secondary Color - Deep Blue */
--secondary: #214B9D;        /* Secondary buttons, gradients, accents */
--secondary-light: #E8EEF7;  /* Light backgrounds */
--secondary-dark: #1A3C7E;   /* Hover states */
--secondary-rgb: 33, 75, 157;/* For rgba() usage */

/* Hero Gradient (use this for headers) */
/* background: linear-gradient(135deg, #159DB3 0%, #1A7A9D 50%, #214B9D 100%); */

/* Neutral Colors */
--white: #FFFFFF;            /* Main backgrounds, cards */
--gray-50: #F9FAFB;          /* Subtle backgrounds */
--gray-100: #F3F4F6;         /* Disabled states */
--gray-200: #E5E7EB;         /* Borders */
--gray-300: #D1D5DB;         /* Dividers */
--gray-400: #9CA3AF;         /* Placeholder text */
--gray-500: #6B7280;         /* Secondary text */
--gray-600: #4B5563;         /* Body text */
--gray-700: #374151;         /* Headings */
--gray-800: #1F2937;         /* Dark text */
--gray-900: #111827;         /* Darkest text */

/* Semantic Colors */
--success: #10B981;          /* Correct answers, success messages */
--success-light: #D1FAE5;    /* Success backgrounds */
--error: #EF4444;            /* Incorrect answers, errors */
--error-light: #FEE2E2;      /* Error backgrounds */
--warning: #F59E0B;          /* Warnings */
--warning-light: #FEF3C7;    /* Warning backgrounds */
--info: #3B82F6;             /* Info messages */
--info-light: #DBEAFE;       /* Info backgrounds */
```
Typography
css/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px - Small labels */
--text-sm: 0.875rem;     /* 14px - Secondary text */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Subheadings */
--text-xl: 1.25rem;      /* 20px - Card titles */
--text-2xl: 1.5rem;      /* 24px - Page titles */
--text-3xl: 1.875rem;    /* 30px - Hero text */
--text-4xl: 2.25rem;     /* 36px - Large displays */

/* Font Weights */
--font-normal: 400;      /* Regular text */
--font-medium: 500;      /* Emphasized text */
--font-semibold: 600;    /* Subheadings */
--font-bold: 700;        /* Headings, buttons */

/* Line Heights */
--leading-tight: 1.25;   /* Headings */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.75; /* Comfortable reading */
Spacing System
css/* Consistent spacing scale (Tailwind-like) */
--space-0: 0;
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-5: 1.25rem;      /* 20px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
--space-20: 5rem;        /* 80px */
Border Radius
css--radius-sm: 0.25rem;    /* 4px - Small elements */
--radius-md: 0.5rem;     /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - Cards */
--radius-xl: 1rem;       /* 16px - Large cards */
--radius-full: 9999px;   /* Circular buttons */
Shadows
css--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
Component Patterns
Buttons
Primary Button:
css.btn-primary {
  background-color: var(--primary);
  color: var(--white);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}

.btn-primary:disabled {
  background-color: var(--gray-300);
  cursor: not-allowed;
}
Secondary Button:
css.btn-secondary {
  background-color: var(--white);
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--primary-light);
}
Danger Button (for delete actions):
css.btn-danger {
  background-color: var(--error);
  color: var(--white);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-danger:hover {
  background-color: #DC2626;
}
Form Inputs
css.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--gray-900);
  background-color: var(--white);
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.input::placeholder {
  color: var(--gray-400);
}

.input:disabled {
  background-color: var(--gray-100);
  cursor: not-allowed;
}
Cards
css.card {
  background-color: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  border: 1px solid var(--gray-200);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```

---

## 7. Page-by-Page UI Specifications

### 7.1 Login Page

**Route:** `/login`

**Layout:**
- Full viewport height
- Centered content
- Gradient background


Detailed Specifications:
Background:

Gradient from #E0F7F4 (top) to #FFFFFF (bottom)
Full viewport height (100vh)
Display: flex, centered (align-items: center, justify-content: center)

Login Card:

Width: 400px (max-width: 90% on mobile)
Background: #FFFFFF
Border radius: 12px
Box shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)
Padding: 48px 32px

Logo:

Text or SVG
Font size: 32px
Font weight: 700 (bold)
Color: #1fac93
Text align: center
Margin bottom: 8px

Title ("Login"):

Font size: 24px
Font weight: 600 (semibold)
Color: #1A1A1A
Text align: center
Margin bottom: 32px

Email Input:

Label: "Email Address"

Font size: 14px
Color: #6B7280
Margin bottom: 8px
Display: block


Input field:

Width: 100%
Padding: 12px 16px
Border: 1px solid #E5E7EB
Border radius: 8px
Font size: 16px
Background: #FFFFFF
Placeholder: "you@example.com" (color: #9CA3AF)


Focus state:

Border color: #1fac93
Box shadow: 0 0 0 3px #E0F7F4
Outline: none


Margin bottom: 20px

Password Input:

Label: "Password"

Font size: 14px
Color: #6B7280
Margin bottom: 8px
Display: block


Input field:

Width: 100%
Type: password
Padding: 12px 16px
Border: 1px solid #E5E7EB
Border radius: 8px
Font size: 16px
Background: #FFFFFF
Placeholder: "••••••••" (color: #9CA3AF)


Focus state: Same as email
Margin bottom: 24px

Sign In Button:

Width: 100%
Background: #1fac93
Color: #FFFFFF
Font size: 16px
Font weight: 600 (semibold)
Padding: 14px 16px
Border: none
Border radius: 8px
Cursor: pointer
Transition: background-color 0.2s ease
Hover state:

Background: #189f84


Margin bottom: 24px

Register Link:

Text: "Don't have an account? Register"
Font size: 14px
Text align: center
Color for "Register": #1fac93
Color for rest: #6B7280
Cursor: pointer on "Register"
Hover state for "Register":

Text decoration: underline



Error Message (if login fails):

Background: #FEE2E2
Border: 1px solid #EF4444
Border radius: 8px
Padding: 12px 16px
Color: #EF4444
Font size: 14px
Margin bottom: 20px
Display: none (shown only on error)

React Component Structure:
jsx<div className="login-container">
  <div className="login-card">
    <h1 className="logo">ABA Collect</h1>
    <h2 className="title">Login</h2>
    
    {error && <div className="error-message">{error}</div>}
    
    <form onSubmit={handleLogin}>
      <div className="form-group">
        <label>Email Address</label>
        <input 
          type="email" 
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Password</label>
        <input 
          type="password" 
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" className="btn-primary">
        Sign In
      </button>
    </form>
    
    <p className="register-link">
      Don't have an account? <Link to="/register">Register</Link>
    </p>
  </div>
</div>
```

---

### 7.2 Register Page

**Route:** `/register`

**Layout:** Same as Login page

**Differences:**
- Title: "Create Account"
- Additional field: "Full Name" (before email)
- Button text: "Create Account"
- Link: "Already have an account? Login"
- Password confirmation field

**Full Name Input:**
- Label: "Full Name"
- Placeholder: "John Doe"
- Same styling as email input
- Placed before email field

**Confirm Password Input:**
- Label: "Confirm Password"
- Placeholder: "••••••••"
- Same styling as password input
- Placed after password field
- Validation: Must match password field

---

### 7.3 Dashboard Page

**Route:** `/dashboard` (protected - requires authentication)

**Layout:**
- Header at top (fixed)
- Sidebar on left (collapsible on mobile)
- Main content area

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Logo] [Dashboard] [User Menu]                      │
├──────┬──────────────────────────────────────────────────────┤
│      │                                                       │
│ Side │  Welcome back, John!                                 │
│ bar  │                                                       │
│      │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ -    │  │ Clients  │ │ Sessions │ │ Programs │            │
│ Dash │  │   12     │ │   45     │ │   38     │            │
│ -    │  └──────────┘ └──────────┘ └──────────┘            │
│ Clie │                                                       │
│ nts  │  Recent Clients                                      │
│ -    │  ┌──────────────────────────────────┐              │
│ Prog │  │ Alex Johnson      [View]         │              │
│ rams │  │ Age 7 • 5 programs               │              │
│ -    │  └──────────────────────────────────┘              │
│ Sess │  ┌──────────────────────────────────┐              │
│ ions │  │ Emma Smith        [View]         │              │
│ -    │  │ Age 6 • 4 programs               │              │
│ Repo │  └──────────────────────────────────┘              │
│ rts  │                                                       │
│      │  [+ Add New Client]                                  │
│      │                                                       │
└──────┴───────────────────────────────────────────────────────┘

Detailed Specifications:
Header:

Position: fixed, top: 0, left: 0, right: 0
Height: 64px
Background: #FFFFFF
Border bottom: 1px solid #E5E7EB
Box shadow: 0 1px 3px 0 rgba(0,0,0,0.1)
Z-index: 50
Display: flex, align-items: center, justify-content: space-between
Padding: 0 24px

Header Logo:

Font size: 20px
Font weight: 700 (bold)
Color: #1fac93

Header Navigation:

Display: flex, gap: 32px
Font size: 15px
Color: #6B7280
Active link color: #1fac93
Active link border-bottom: 2px solid #1fac93

User Menu (right side):

Display: flex, align-items: center, gap: 12px
User avatar: Circle, 36px diameter, background: #E0F7F4, color: #1fac93
Dropdown on click with:

Profile
Settings
Logout



Sidebar:

Width: 240px (collapsed: 64px on mobile)
Background: #F9FAFB
Border right: 1px solid #E5E7EB
Padding: 88px 16px 16px (88px top to account for fixed header)
Height: 100vh
Position: fixed

Sidebar Links:

Display: block
Padding: 12px 16px
Border radius: 8px
Color: #6B7280
Font size: 15px
Font weight: 500 (medium)
Margin bottom: 4px
Transition: background-color 0.2s ease
Active state:

Background: #E0F7F4
Color: #1fac93


Hover state:

Background: #F3F4F6


Icon and text display: flex, gap: 12px, align-items: center

Main Content Area:

Margin left: 240px (0 on mobile with sidebar collapsed)
Margin top: 64px (to account for fixed header)
Padding: 32px
Background: #FFFFFF
Min-height: calc(100vh - 64px)

Welcome Section:

Margin bottom: 32px
Font size: 28px
Font weight: 700 (bold)
Color: #1A1A1A

Stats Cards Row:

Display: grid, grid-template-columns: repeat(3, 1fr)
Gap: 24px
Margin bottom: 40px
On mobile: grid-template-columns: 1fr (stacked)

Individual Stat Card:

Background: #FFFFFF
Border: 1px solid #E5E7EB
Border radius: 12px
Padding: 24px
Display: flex, flex-direction: column
Transition: box-shadow 0.2s ease
Hover:

Box shadow: 0 4px 6px -1px rgba(0,0,0,0.1)



Stat Card Number:

Font size: 36px
Font weight: 700 (bold)
Color: #1fac93
Margin bottom: 8px

Stat Card Label:

Font size: 14px
Color: #6B7280
Font weight: 500 (medium)

Recent Clients Section:

Margin bottom: 32px

Section Title:

Font size: 20px
Font weight: 600 (semibold)
Color: #1A1A1A
Margin bottom: 16px

Client Cards:

Background: #FFFFFF
Border: 1px solid #E5E7EB
Border radius: 12px
Padding: 20px
Margin bottom: 12px
Display: flex, justify-content: space-between, align-items: center
Transition: border-color 0.2s ease
Hover:

Border color: #1fac93
Cursor: pointer



Client Card - Left Side:

Display: flex, flex-direction: column, gap: 4px

Client Name:

Font size: 18px
Font weight: 600 (semibold)
Color: #1A1A1A

Client Info:

Font size: 14px
Color: #6B7280

Client Card - Right Side:

Button: "View"
Background: #E0F7F4
Color: #1fac93
Padding: 8px 16px
Border radius: 6px
Font weight: 500 (medium)
Font size: 14px
Border: none
Cursor: pointer
Hover:

Background: #C4F1EA



Add New Client Button:

Width: 100%
Background: #1fac93
Color: #FFFFFF
Padding: 14px
Border radius: 8px
Font size: 16px
Font weight: 600 (semibold)
Border: none
Cursor: pointer
Display: flex, align-items: center, justify-content: center, gap: 8px
Hover:

Background: #189f84



React Component Structure:
jsx<div className="dashboard">
  <Header />
  <Sidebar />
  
  <main className="main-content">
    <h1 className="welcome">Welcome back, {user.full_name}!</h1>
    
    <div className="stats-grid">
      <StatCard number="12" label="Total Clients" />
      <StatCard number="45" label="Sessions This Month" />
      <StatCard number="38" label="Active Programs" />
    </div>
    
    <section className="recent-clients">
      <h2>Recent Clients</h2>
      {clients.map(client => (
        <ClientCard 
          key={client.id}
          name={`${client.first_name} ${client.last_name}`}
          age={client.age}
          programsCount={client.programs_count}
          onClick={() => navigate(`/clients/${client.id}`)}
        />
      ))}
      
      <button 
        className="btn-primary add-client"
        onClick={() => navigate('/clients/new')}
      >
        <Plus size={20} />
        Add New Client
      </button>
    </section>
  </main>
</div>
```

---

### 7.4 Clients List Page

**Route:** `/clients`

**Layout:** Same header + sidebar, main content shows client list

**Structure:**
```
┌──────┬──────────────────────────────────────────────────────┐
│      │ Clients                                  [+ Add]     │
│ Side │                                                      │
│ bar  │ [Search...]                                          │
│      │                                                       │
│      │ ┌──────────────────────────────────────────────┐   │
│      │ │ Alex Johnson             Age: 7              │   │
│      │ │ 5 programs • Last session: Jan 15            │   │
│      │ └──────────────────────────────────────────────┘   │
│      │                                                       │
│      │ ┌──────────────────────────────────────────────┐   │
│      │ │ Emma Smith               Age: 6              │   │
│      │ │ 4 programs • Last session: Jan 14            │   │
│      │ └──────────────────────────────────────────────┘   │
│      │                                                       │
└──────┴───────────────────────────────────────────────────────┘
Detailed Specifications:
Page Header:

Display: flex, justify-content: space-between, align-items: center
Margin bottom: 24px

Page Title:

Font size: 28px
Font weight: 700 (bold)
Color: #1A1A1A

Add Button:

Background: #1fac93
Color: #FFFFFF
Padding: 10px 20px
Border radius: 8px
Font size: 15px
Font weight: 600 (semibold)
Border: none
Cursor: pointer
Display: flex, align-items: center, gap: 8px
Hover:

Background: #189f84



Search Bar:

Width: 100%
Max-width: 500px
Margin bottom: 24px
Position: relative

Search Input:

Width: 100%
Padding: 12px 16px 12px 44px (extra left padding for icon)
Border: 1px solid #E5E7EB
Border radius: 8px
Font size: 15px
Background: #FFFFFF
Placeholder: "Search clients by name..."
Placeholder color: #9CA3AF

Search Icon:

Position: absolute, left: 16px, top: 50%, transform: translateY(-50%)
Color: #6B7280
Size: 20px

Client Card:

Background: #FFFFFF
Border: 1px solid #E5E7EB
Border radius: 12px
Padding: 24px
Margin bottom: 16px
Display: flex, justify-content: space-between, align-items: center
Transition: all 0.2s ease
Cursor: pointer
Hover:

Border color: #1fac93
Box shadow: 0 4px 6px -1px rgba(0,0,0,0.1)



Client Card - Left Content:

Display: flex, flex-direction: column, gap: 8px

Client Name:

Font size: 20px
Font weight: 600 (semibold)
Color: #1A1A1A

Client Meta Info:

Font size: 14px
please continue u stopped6:11 AM
Color: #6B7280
Display: flex, gap: 16px
Items separated by "•"

Empty State (no clients):

Display: flex, flex-direction: column, align-items: center, justify-content: center
Padding: 80px 20px
Text align: center

Empty State Icon:

Size: 64px
Color: #D1D5DB
Margin bottom: 16px

Empty State Text:

Font size: 18px
Color: #6B7280
Margin bottom: 24px

Empty State Button:

Same as Add Button styling


7.5 Client Detail Page
Route: /clients/:id
Layout: Header + sidebar, main content with tabs
Structure:
┌──────┬──────────────────────────────────────────────────────┐
│      │ Alex Johnson, 7                          [Edit]      │
│ Side │ Autism Spectrum Disorder                             │
│ bar  │                                                       │
│      │ [Programs] [Session History]                         │
│      │ ─────────                                            │
│      │                                                       │
│      │ ┌──────────────────────────────────────────────┐   │
│      │ │ Identify Colors              [Start Session] │   │
│      │ │ Skill Acquisition • Trial-based               │   │
│      │ │ Progress: 85% → [View Graph]                 │   │
│      │ └──────────────────────────────────────────────┘   │
│      │                                                       │
│      │ ┌──────────────────────────────────────────────┐   │
│      │ │ Tantrum Reduction            [Start Session] │   │
│      │ │ Behavior Reduction • Frequency counting       │   │
│      │ │ Trend: Decreasing → [View Graph]             │   │
│      │ └──────────────────────────────────────────────┘   │
│      │                                                       │
│      │ [+ Add Program]                                      │
└──────┴───────────────────────────────────────────────────────┘
Detailed Specifications:
Client Header Section:

Background: #F9FAFB
Padding: 24px 32px
Border bottom: 1px solid #E5E7EB
Margin bottom: 24px

Client Name & Age:

Font size: 32px
Font weight: 700 (bold)
Color: #1A1A1A
Display: flex, align-items: center, gap: 16px

Edit Button:

Background: transparent
Border: 1px solid #E5E7EB
Color: #6B7280
Padding: 8px 16px
Border radius: 6px
Font size: 14px
Font weight: 500 (medium)
Cursor: pointer
Hover:

Background: #F3F4F6



Diagnosis:

Font size: 16px
Color: #6B7280
Margin top: 8px

Tabs:

Display: flex, gap: 32px
Border bottom: 2px solid #E5E7EB
Margin bottom: 24px

Tab Button:

Background: transparent
Border: none
Padding: 12px 0
Font size: 16px
Font weight: 500 (medium)
Color: #6B7280
Cursor: pointer
Position: relative
Transition: color 0.2s ease

Active Tab:

Color: #1fac93
Border-bottom: 2px solid #1fac93
Margin-bottom: -2px

Program Card:

Background: #FFFFFF
Border: 1px solid #E5E7EB
Border radius: 12px
Padding: 24px
Margin bottom: 16px

Program Card Header:

Display: flex, justify-content: space-between, align-items: flex-start
Margin bottom: 12px

Program Name:

Font size: 20px
Font weight: 600 (semibold)
Color: #1A1A1A

Start Session Button:

Background: #1fac93
Color: #FFFFFF
Padding: 10px 20px
Border radius: 8px
Font size: 14px
Font weight: 600 (semibold)
Border: none
Cursor: pointer
Display: flex, align-items: center, gap: 8px
Hover:

Background: #189f84



Program Meta:

Display: flex, gap: 16px
Font size: 14px
Color: #6B7280
Margin bottom: 12px

Program Type Badge:

Display: inline-block
Padding: 4px 12px
Border radius: 12px
Font size: 12px
Font weight: 500 (medium)

Skill Badge:

Background: #DBEAFE
Color: #1E40AF

Behavior Badge:

Background: #FEE2E2
Color: #B91C1C

Progress Section:

Display: flex, align-items: center, gap: 12px
Font size: 14px

Progress Label:

Color: #6B7280

Progress Value:

Color: #1A1A1A
Font weight: 600 (semibold)

View Graph Link:

Color: #1fac93
Text decoration: none
Font weight: 500 (medium)
Hover:

Text decoration: underline



Add Program Button:

Width: 100%
Background: #E0F7F4
Color: #1fac93
Padding: 14px
Border: 2px dashed #1fac93
Border radius: 8px
Font size: 16px
Font weight: 600 (semibold)
Cursor: pointer
Display: flex, align-items: center, justify-content: center, gap: 8px
Hover:

Background: #C4F1EA




7.6 Session Data Collection Page
Route: /sessions/:id/collect
This is the MOST IMPORTANT page - where therapists spend most time.
Layout: Minimal chrome, focus on data entry
Structure:
┌──────────────────────────────────────────────────────────────┐
│ [End Session] Alex Johnson • Identify Colors    [00:15:30]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│     ┌─────────────────────────────────────────────┐         │
│     │                                             │         │
│     │         Trial Data Collection               │         │
│     │                                             │         │
│     │   ┌──────────────────┐ ┌──────────────────┐│         │
│     │   │                  │ │                  ││         │
│     │   │    ✓ CORRECT     │ │   ✗ INCORRECT    ││         │
│     │   │                  │ │                  ││         │
│     │   └──────────────────┘ └──────────────────┘│         │
│     │                                             │         │
│     │         Prompt Level (Optional)             │         │
│     │   ┌────┐ ┌────┐ ┌────┐ ┌────┐            │         │
│     │   │Ind │ │Ver │ │Ges │ │Phy │            │         │
│     │   └────┘ └────┘ └────┘ └────┘            │         │
│     │                                             │         │
│     │   Session Stats:                            │         │
│     │   Correct: 8    Incorrect: 2    Total: 10  │         │
│     │   Accuracy: 80%                             │         │
│     │                                             │         │
│     └─────────────────────────────────────────────┘         │
│                                                               │
│     [Quick Notes]                                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
Detailed Specifications:
Session Header:

Position: fixed, top: 0, left: 0, right: 0
Height: 64px
Background: #1fac93
Color: #FFFFFF
Display: flex, justify-content: space-between, align-items: center
Padding: 0 24px
Box shadow: 0 2px 4px rgba(0,0,0,0.1)
Z-index: 50

End Session Button:

Background: #FFFFFF
Color: #1fac93
Padding: 10px 20px
Border radius: 6px
Font size: 14px
Font weight: 600 (semibold)
Border: none
Cursor: pointer
Hover:

Background: #F3F4F6



Client & Program Info:

Font size: 18px
Font weight: 600 (semibold)
Color: #FFFFFF
Display: flex, align-items: center, gap: 12px

Timer:

Font size: 24px
Font weight: 700 (bold)
Color: #FFFFFF
Font-family: monospace

Main Content:

Margin top: 64px (to account for fixed header)
Padding: 40px 24px
Max-width: 800px
Margin: 64px auto 0

Data Collection Card:

Background: #FFFFFF
Border: 2px solid #E5E7EB
Border radius: 16px
Padding: 32px
Box shadow: 0 4px 6px -1px rgba(0,0,0,0.1)

Section Title:

Font size: 20px
Font weight: 600 (semibold)
Color: #1A1A1A
Text align: center
Margin bottom: 24px

Correct/Incorrect Buttons:

Display: grid, grid-template-columns: 1fr 1fr
Gap: 16px
Margin bottom: 32px

Correct Button:

Background: #10B981
Color: #FFFFFF
Padding: 48px 24px
Border: none
Border radius: 12px
Font size: 24px
Font weight: 700 (bold)
Cursor: pointer
Transition: all 0.2s ease
Display: flex, flex-direction: column, align-items: center, justify-content: center, gap: 12px
Hover:

Background: #059669
Transform: scale(1.02)


Active (pressed):

Transform: scale(0.98)



Incorrect Button:

Background: #EF4444
Color: #FFFFFF
Same styling as Correct Button
Hover:

Background: #DC2626



Prompt Level Section:

Margin bottom: 32px

Prompt Label:

Font size: 16px
Color: #6B7280
Text align: center
Margin bottom: 12px

Prompt Buttons:

Display: grid, grid-template-columns: repeat(4, 1fr)
Gap: 12px

Individual Prompt Button:

Background: #F3F4F6
Color: #6B7280
Padding: 16px 12px
Border: 2px solid transparent
Border radius: 8px
Font size: 14px
Font weight: 600 (semibold)
Cursor: pointer
Transition: all 0.2s ease
Text align: center
Hover:

Background: #E5E7EB
Border color: #1fac93


Active/Selected:

Background: #E0F7F4
Border color: #1fac93
Color: #1fac93



Session Stats Box:

Background: #F9FAFB
Border: 1px solid #E5E7EB
Border radius: 8px
Padding: 20px

Stats Title:

Font size: 14px
Color: #6B7280
Font weight: 500 (medium)
Margin bottom: 12px

Stats Grid:

Display: grid, grid-template-columns: repeat(3, 1fr)
Gap: 16px
Margin bottom: 16px

Stat Item:

Text align: center

Stat Value:

Font size: 28px
Font weight: 700 (bold)
Color: #1A1A1A

Stat Label:

Font size: 12px
Color: #6B7280
Margin top: 4px

Accuracy Display:

Font size: 20px
Font weight: 700 (bold)
Color: #1fac93
Text align: center
Padding top: 16px
Border top: 1px solid #E5E7EB

Quick Notes Section:

Margin top: 24px

Notes Label:

Font size: 14px
Color: #6B7280
Font weight: 500 (medium)
Margin bottom: 8px

Notes Textarea:

Width: 100%
Padding: 12px 16px
Border: 1px solid #E5E7EB
Border radius: 8px
Font size: 15px
Font family: inherit
Min-height: 100px
Resize: vertical
Focus:

Outline: none
Border color: #1fac93
Box shadow: 0 0 0 3px #E0F7F4



For Frequency Data Collection:
Replace trial buttons with:
Count Display:

Text align: center
Margin bottom: 32px

Count Number:

Font size: 72px
Font weight: 700 (bold)
Color: #1fac93

Count Label:

Font size: 18px
Color: #6B7280
Margin top: 8px

Add Occurrence Button:

Width: 100%
Background: #1fac93
Color: #FFFFFF
Padding: 32px
Border: none
Border radius: 12px
Font size: 24px
Font weight: 700 (bold)
Cursor: pointer
Display: flex, align-items: center, justify-content: center, gap: 12px
Transition: all 0.2s ease
Hover:

Background: #189f84
Transform: scale(1.02)


Active:

Transform: scale(0.98)



For Duration Data Collection:
Timer Display:

Text align: center
Margin bottom: 32px

Timer Number:

Font size: 72px
Font weight: 700 (bold)
Color: #1fac93
Font-family: monospace

Start/Stop Buttons:

Display: grid, grid-template-columns: 1fr 1fr
Gap: 16px

Start Button:

Background: #10B981
Color: #FFFFFF
Padding: 32px
Border: none
Border radius: 12px
Font size: 20px
Font weight: 700 (bold)
Cursor: pointer
Display: flex, align-items: center, justify-content: center, gap: 12px

Stop Button:

Background: #EF4444
Color: #FFFFFF
Same styling as Start Button

Reset Button:

Width: 100%
Background: #F3F4F6
Color: #6B7280
Padding: 16px
Border: none
Border radius: 8px
Font size: 16px
Font weight: 600 (semibold)
Cursor: pointer
Margin top: 16px


7.7 Session History Page
Route: /clients/:id/sessions or tab on client detail page
Structure:
┌──────────────────────────────────────────────────────────────┐
│ Session History - Alex Johnson                               │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Jan 15, 2024 • 60 min                        [View]      ││
│ │ Programs: Identify Colors, Request Help                   ││
│ │ 25 data points                                            ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Jan 12, 2024 • 45 min                        [View]      ││
│ │ Programs: Identify Colors, Tantrum Reduction              ││
│ │ 18 data points                                            ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
Detailed Specifications:
Page Title:

Font size: 24px
Font weight: 700 (bold)
Color: #1A1A1A
Margin bottom: 24px

Session Card:

Background: #FFFFFF
Border: 1px solid #E5E7EB
Border radius: 12px
Padding: 20px
Margin bottom: 12px
Display: flex, justify-content: space-between, align-items: center
Transition: border-color 0.2s ease
Hover:

Border color: #1fac93
Cursor: pointer



Session Date & Duration:

Font size: 16px
Font weight: 600 (semibold)
Color: #1A1A1A
Margin bottom: 8px

Session Programs:

Font size: 14px
Color: #6B7280
Margin bottom: 4px

Session Data Count:

Font size: 13px
Color: #9CA3AF

View Button:

Background: #E0F7F4
Color: #1fac93
Padding: 8px 16px
Border radius: 6px
Font size: 14px
Font weight: 500 (medium)
Border: none
Cursor: pointer
Hover:

Background: #C4F1EA




7.8 Progress/Graphs Page
Route: /programs/:id/progress
Structure:
┌──────────────────────────────────────────────────────────────┐
│ Identify Colors - Progress                                   │
│                                                               │
│ Date Range: [Last 30 Days ▼]               [Export CSV]     │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐│
│ │                                                           ││
│ │    Progress Over Time                                     ││
│ │    100%│                                                  ││
│ │     80%│        ●─────●                                   ││
│ │     60%│    ●─────●                                       ││
│ │     40%│●─────●                                           ││
│ │     20%│                                                  ││
│ │      0%└────────────────────────────────                 ││
│ │        Jan 1   Jan 8   Jan 15  Jan 22                    ││
│ │                                                           ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ Overall Stats                                                │
│ Average Accuracy: 78% • Total Sessions: 12 • Trend: ↗       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
Detailed Specifications:
Page Header:

Display: flex, justify-content: space-between, align-items: center
Margin bottom: 24px

Page Title:

Font size: 28px
Font weight: 700 (bold)
Color: #1A1A1A

Controls Row:

Display: flex, gap: 16px, align-items: center
Margin bottom: 24px

Date Range Dropdown:

Background: #FFFFFF
Border: 1px solid #E5E7EB
Border radius: 8px
Padding: 10px 16px
Font size: 14px
Color: #1A1A1A
Cursor: pointer
Min-width: 180px

Export Button:

Background: #F3F4F6
Color: #6B7280
Border: 1px solid #E5E7EB
Padding: 10px 20px
Border radius: 8px
Font size: 14px
Font weight: 500 (medium)
Cursor: pointer
Display: flex, align-items: center, gap: 8px
Hover:

Background: #E5E7EB



Chart Container:

Background: #FFFFFF
Border: 1px solid #E5E7EB
Border radius: 12px
Padding: 32px
Margin bottom: 24px

Chart Title:

Font size: 18px
Font weight: 600 (semibold)
Color: #1A1A1A
Margin bottom: 24px

Chart (Recharts):

Use Recharts LineChart component
Line color: #1fac93
Line width: 3px
Point radius: 6px
Grid color: #E5E7EB
Axis color: #6B7280
Tooltip background: #FFFFFF
Tooltip border: 1px solid #E5E7EB

Stats Section:

Background: #F9FAFB
Border: 1px solid #E5E7EB
Border radius: 8px
Padding: 20px

Stats Title:

Font size: 16px
Font weight: 600 (semibold)
Color: #1A1A1A
Margin bottom: 12px

Stats Values:

Font size: 14px
Color: #6B7280
Display: inline-flex, gap: 24px
Align items: center

Stat Value:

Color: #1A1A1A
Font weight: 600 (semibold)

Trend Indicator:

Color: #10B981 (improving) or #EF4444 (declining)
Font weight: 600 (semibold)