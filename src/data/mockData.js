// Mock data for development (will be replaced with API calls)

export const mockClients = [
    {
        id: 1,
        first_name: 'Alex',
        last_name: 'Johnson',
        date_of_birth: '2017-03-15',
        age: 7,
        diagnosis: 'Autism Spectrum Disorder',
        notes: 'Responds well to visual cues. Preferred reinforcer: iPad time.',
        programs_count: 5,
        last_session: '2024-01-15T10:30:00Z',
        created_at: '2023-06-01T08:00:00Z',
        is_active: true
    },
    {
        id: 2,
        first_name: 'Emma',
        last_name: 'Smith',
        date_of_birth: '2018-07-22',
        age: 6,
        diagnosis: 'Autism Spectrum Disorder',
        notes: 'Making great progress with verbal communication.',
        programs_count: 4,
        last_session: '2024-01-14T14:00:00Z',
        created_at: '2023-08-15T09:30:00Z',
        is_active: true
    },
    {
        id: 3,
        first_name: 'Michael',
        last_name: 'Brown',
        date_of_birth: '2016-11-08',
        age: 8,
        diagnosis: 'ASD with ADHD',
        notes: 'Needs frequent breaks. Use token economy.',
        programs_count: 6,
        last_session: '2024-01-13T11:00:00Z',
        created_at: '2023-03-20T10:00:00Z',
        is_active: true
    },
    {
        id: 4,
        first_name: 'Sophia',
        last_name: 'Davis',
        date_of_birth: '2019-02-14',
        age: 5,
        diagnosis: 'Developmental Delay',
        notes: 'New client. Still assessing baseline skills.',
        programs_count: 3,
        last_session: '2024-01-12T09:00:00Z',
        created_at: '2024-01-01T10:00:00Z',
        is_active: true
    }
]

export const mockPrograms = [
    {
        id: 1,
        client_id: 1,
        name: 'Identify Colors',
        program_type: 'skill',
        data_type: 'trial',
        description: 'Child will identify colors when asked "What color is this?"',
        mastery_criteria: '80% accuracy across 3 consecutive sessions',
        progress: 85,
        is_active: true
    },
    {
        id: 2,
        client_id: 1,
        name: 'Request Help',
        program_type: 'skill',
        data_type: 'trial',
        description: 'Child will appropriately request help when needed',
        mastery_criteria: '90% independence across 5 sessions',
        progress: 65,
        is_active: true
    },
    {
        id: 3,
        client_id: 1,
        name: 'Tantrum Reduction',
        program_type: 'behavior',
        data_type: 'frequency',
        description: 'Track frequency of tantrum behaviors',
        mastery_criteria: 'Less than 2 occurrences per session for 5 sessions',
        trend: 'decreasing',
        is_active: true
    },
    {
        id: 4,
        client_id: 1,
        name: 'On-Task Duration',
        program_type: 'behavior',
        data_type: 'duration',
        description: 'Track duration of on-task behavior during activities',
        mastery_criteria: '10+ minutes sustained attention',
        trend: 'increasing',
        is_active: true
    },
    {
        id: 5,
        client_id: 2,
        name: 'Label Objects',
        program_type: 'skill',
        data_type: 'trial',
        description: 'Child will label common objects',
        mastery_criteria: '80% accuracy across 3 sessions',
        progress: 72,
        is_active: true
    }
]

export const mockSessions = [
    {
        id: 1,
        client_id: 1,
        client_name: 'Alex Johnson',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        duration_minutes: 60,
        programs: ['Identify Colors', 'Request Help'],
        data_points: 25,
        notes: 'Good session overall. Showed improvement in color identification.'
    },
    {
        id: 2,
        client_id: 1,
        client_name: 'Alex Johnson',
        start_time: '2024-01-12T14:00:00Z',
        end_time: '2024-01-12T14:45:00Z',
        duration_minutes: 45,
        programs: ['Identify Colors', 'Tantrum Reduction'],
        data_points: 18,
        notes: 'Had one tantrum during transition. Recovered quickly.'
    },
    {
        id: 3,
        client_id: 2,
        client_name: 'Emma Smith',
        start_time: '2024-01-14T09:00:00Z',
        end_time: '2024-01-14T10:00:00Z',
        duration_minutes: 60,
        programs: ['Label Objects'],
        data_points: 20,
        notes: 'Excellent focus today!'
    }
]

export const mockStats = {
    totalClients: 12,
    sessionsThisMonth: 45,
    activePrograms: 38
}
