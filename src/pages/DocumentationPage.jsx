import { useState } from 'react'
import { DashboardLayout } from '../components/layout'
import {
    Book,
    Users,
    FileText,
    Play,
    BarChart3,
    Settings,
    Shield,
    Download,
    Bell,
    Target,
    Clock,
    ListChecks,
    Hash,
    ChevronRight
} from 'lucide-react'

const docSections = [
    {
        id: 'clients',
        title: 'Clients',
        icon: Users,
        content: `
## Managing Clients

Clients are the individuals you're providing therapy services to. Each client can have multiple programs and sessions.

### Adding a Client
1. Navigate to **Clients > Add Client**
2. Enter the client's first and last name
3. Set the date of birth (used for age calculations)
4. Add any relevant notes
5. Click **Save Client**

### Client Profile
Each client's profile shows:
- Basic information (name, age, date of birth)
- All assigned programs with progress indicators
- Recent session history
- Quick links to start a new session

### Editing & Archiving
- Click the **Edit** button to update client information
- Use the archive feature to hide inactive clients without deleting data
        `
    },
    {
        id: 'programs',
        title: 'Programs',
        icon: FileText,
        content: `
## Creating Programs

Programs define skills or behaviors you're tracking. Each program has a specific data type that determines how data is collected.

### Data Types

#### Trial-Based Data
Best for: Discrete trial training, yes/no responses
- Record **Correct** or **Incorrect** for each trial
- Optionally record prompt level (Independent, Verbal, Gestural, Physical)
- Accuracy calculated automatically

#### Frequency Data
Best for: Counting occurrences of a behavior
- Tap to count each occurrence
- Great for behavior tracking, manding, etc.

#### Duration Data
Best for: Timing behaviors
- Start/stop timer for each occurrence
- Records duration in seconds
- Useful for attention span, tantrum duration, etc.

#### Task Analysis
Best for: Multi-step skills
- Define steps in order
- Mark each step as complete/incomplete
- Track percentage of steps completed independently

### Mastery Criteria
Set when a target is considered "mastered":
- **Threshold**: Required accuracy (e.g., 80%)
- **Consecutive Sessions**: How many sessions in a row (e.g., 3)
        `
    }, 
    {
        id: 'targets',
        title: 'Targets',
        icon: Target,
        content: `
## Working with Targets

Targets are specific skills within a program. For example, a "Receptive Language" program might have targets like "Point to red," "Point to blue," etc.

### Adding Targets
1. Open a program
2. Click **Add Target**
3. Enter the target name and description
4. Set mastery criteria (defaults from your Settings)
5. Click Save

### Target Status 
- **Active**: Currently being worked on
- **Mastered**: Met criteria, shown with green badge
- **On Hold**: Temporarily paused

### Progress Tracking 
Each target shows:
- Current accuracy percentage
- Number of trials/sessions
- Progress toward mastery
- Historical performance graph 
        `
    },
    {
        id: 'sessions',
        title: 'Sessions',
        icon: Play,
        content: `
## Data Collection Sessions

Sessions are where you record actual data during therapy.

### Starting a Session
1. Click **New Session** from Dashboard or Sessions page
2. Select a client
3. Choose a program (or start and switch between programs)
4. Begin recording data

### During a Session
- Use large **Correct/Incorrect** buttons for trial data
- Tap to count for frequency data
- Use timer for duration data
- Session timer shows elapsed time
- Switch between programs using the sidebar

### Prompt Levels
When Show Prompt Levels is enabled (Settings > Therapy Defaults):
- **Ind** (Independent): No prompting needed
- **Ver** (Verbal): Verbal cue given
- **Ges** (Gestural): Pointing/gestural prompt
- **Phy** (Physical): Hand-over-hand assistance

### Ending a Session
1. Click **End Session** button
2. Add any session notes
3. Data is saved automatically
4. View session summary
        `
    },
    {
        id: 'reports',
        title: 'Reports & Analytics',
        icon: BarChart3,
        content: `
## Reports & Analytics

Track progress over time with visual reports and data analysis.

### Progress Graphs
- Line charts showing accuracy over time
- Filter by date range
- Compare multiple targets

### Session Reports
- Summary of each session
- Data points recorded
- Duration and notes

### Exporting Data
Go to **Settings > Data & Export**:
- **Export All Data**: Download complete JSON backup
- **Session Reports**: Print-friendly session summaries

### Key Metrics
- Overall accuracy per program
- Trials per session
- Time spent in therapy
- Mastery progression
        `
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: Settings,
        content: `
## Configuration & Settings

Customize Data Sirena to match your workflow.

### Account Settings
- Update your name and email
- Change your role (BCBA, RBT, Therapist, etc.)

### Therapy Defaults
These values are used when creating new programs/targets:
- **Default Session Duration**: Expected session length (shown in header)
- **Default Mastery Criteria**: Accuracy threshold (e.g., 80%)
- **Consecutive Sessions**: Sessions needed for mastery (e.g., 3)
- **Auto-Save Interval**: How often to show save indicator
- **Show Prompt Levels**: Toggle prompt buttons on/off

### Notifications
- Session reminders (requires scheduled sessions)
- Progress alerts (future feature)
- Mastery notifications (future feature)

### Data & Export
- Export all data as JSON
- Access session reports
        `
    },
    {
        id: 'security',
        title: 'Security & Compliance',
        icon: Shield,
        content: `
## Security & HIPAA Compliance

Data Sirena is designed with privacy and security in mind.

### Auto-Logout
For HIPAA compliance, sessions automatically log out after **15 minutes of inactivity**. This protects client data if you step away from your device.

### Data Protection
- All data is encrypted in transit and at rest
- Passwords are hashed, never stored in plain text
- Session tokens expire regularly

### Audit Logs
All data access and modifications are logged:
- Who accessed what data
- When changes were made
- What was changed

### Soft Delete
When data is deleted, it's "soft deleted" - marked as removed but retained for compliance. This allows for audit trails and potential recovery.

### Best Practices
- Log out when finished
- Don't share login credentials
- Use strong passwords
- Export data regularly for backups
        `
    }
]

function TableOfContents({ sections, activeSection, onSelectSection }) {
    return (
        <nav className="sticky top-24 space-y-1">
            <p className="label-uppercase px-3 mb-3">Documentation</p>
            {sections.map((section) => {
                const Icon = section.icon
                return (
                    <button
                        key={section.id}
                        onClick={() => onSelectSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === section.id
                                ? 'bg-[#E0F4F7] text-[#159DB3] font-semibold'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Icon size={18} />
                        {section.title}
                        {activeSection === section.id && (
                            <ChevronRight size={16} className="ml-auto" />
                        )}
                    </button>
                )
            })}
        </nav>
    )
}

function MarkdownContent({ content }) {
    // Simple markdown-like rendering
    const lines = content.trim().split('\n')

    return (
        <div className="prose prose-gray max-w-none">
            {lines.map((line, i) => {
                const trimmed = line.trim()

                if (trimmed.startsWith('## ')) {
                    return <h2 key={i} className="font-heading text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">{trimmed.slice(3)}</h2>
                }
                if (trimmed.startsWith('### ')) {
                    return <h3 key={i} className="font-heading text-xl font-semibold text-gray-900 mt-6 mb-3">{trimmed.slice(4)}</h3>
                }
                if (trimmed.startsWith('#### ')) {
                    return <h4 key={i} className="font-semibold text-gray-900 mt-4 mb-2">{trimmed.slice(5)}</h4>
                }
                if (trimmed.startsWith('- **')) {
                    const match = trimmed.match(/- \*\*(.+?)\*\*:? ?(.*)/)
                    if (match) {
                        return (
                            <div key={i} className="flex items-start gap-2 text-gray-600 mb-2">
                                <span className="text-[#159DB3]">•</span>
                                <span><strong className="text-gray-900">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ''}</span>
                            </div>
                        )
                    }
                }
                if (trimmed.startsWith('- ')) {
                    return (
                        <div key={i} className="flex items-start gap-2 text-gray-600 mb-2">
                            <span className="text-[#159DB3]">•</span>
                            <span>{trimmed.slice(2)}</span>
                        </div>
                    )
                }
                if (/^\d+\./.test(trimmed)) {
                    const num = trimmed.match(/^(\d+)\./)[1]
                    return (
                        <div key={i} className="flex items-start gap-3 text-gray-600 mb-2">
                            <span className="w-6 h-6 bg-[#E0F4F7] text-[#159DB3] rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">{num}</span>
                            <span>{trimmed.replace(/^\d+\.\s*/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</span>
                        </div>
                    )
                }
                if (trimmed === '') {
                    return <div key={i} className="h-4" />
                }

                return <p key={i} className="text-gray-600 mb-3">{trimmed}</p>
            })}
        </div>
    )
}

export default function DocumentationPage() {
    const [activeSection, setActiveSection] = useState('clients')

    const currentSection = docSections.find(s => s.id === activeSection)

    return (
        <DashboardLayout>
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Book size={32} className="text-[#159DB3]" />
                        <h1 className="font-heading text-3xl font-bold text-gray-900">
                            Documentation
                        </h1>
                    </div>
                    <p className="text-gray-500">
                        Learn how to use every feature in Data Sirena.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <TableOfContents
                                sections={docSections}
                                activeSection={activeSection}
                                onSelectSection={setActiveSection}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            {currentSection && (
                                <>
                                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                                        <div className="w-12 h-12 bg-[#E0F4F7] rounded-xl flex items-center justify-center">
                                            <currentSection.icon size={24} className="text-[#159DB3]" />
                                        </div>
                                        <h2 className="font-heading text-2xl font-bold text-gray-900">
                                            {currentSection.title}
                                        </h2>
                                    </div>
                                    <MarkdownContent content={currentSection.content} />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
