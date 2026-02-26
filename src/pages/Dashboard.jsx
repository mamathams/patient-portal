import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCreatePatient, usePatients } from '../hooks/useAPI'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('patients')
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'M',
    city: '',
    state: '',
    status: 'active'
  })
  const queryClient = useQueryClient()
  const createPatient = useCreatePatient()
  const { data: patientsResponse, isLoading, isError, error } = usePatients({ page: 1, limit: 8 })
  const patients = useMemo(() => patientsResponse?.data || [], [patientsResponse])
  const hasCreateError = Boolean(createErrorMessage)

  const handlePatientChange = (event) => {
    const { name, value } = event.target
    setCreateErrorMessage('')
    setPatientForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePatientSubmit = async (event) => {
    event.preventDefault()
    setCreateErrorMessage('')

    const payload = {
      ...patientForm,
      firstName: patientForm.firstName.trim(),
      lastName: patientForm.lastName.trim(),
      email: patientForm.email.trim().toLowerCase(),
      phone: patientForm.phone.trim(),
      dateOfBirth: patientForm.dateOfBirth || null,
      city: patientForm.city.trim(),
      state: patientForm.state.trim()
    }

    try {
      await createPatient.mutateAsync(payload)
      setPatientForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'M',
        city: '',
        state: '',
        status: 'active'
      })
      await queryClient.invalidateQueries({ queryKey: ['patients'] })
    } catch (submitError) {
      const apiMessage =
        submitError?.response?.data?.errors?.[0]?.message ||
        submitError?.response?.data?.message ||
        submitError?.message ||
        'Could not save patient. Check inputs.'
      setCreateErrorMessage(apiMessage)
    }
  }

  return (
    <div className="app">
      <nav className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">H</div>
            <div>
              <div className="brand-title">Hospital Management</div>
              <div className="brand-subtitle">Patient Portal</div>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="search">
              <span className="search-icon">⌕</span>
              <input placeholder="Search patients, doctors, visits" />
            </div>
            <button className="pill">Emergency: +1 (555) 010-200</button>
            <button className="avatar">SM</button>
          </div>
        </div>
      </nav>

      <main className="shell">
        <section className="hero">
          <div className="hero-left">
            <div className="eyebrow">Operational Overview</div>
            <h1>Care delivery, in focus.</h1>
            <p>
              Track patient flow, appointments, and clinician availability from a single
              dashboard built for clarity.
            </p>
            <div className="hero-cta">
              <button className="btn primary">Create Appointment</button>
              <button className="btn ghost">Add Patient</button>
            </div>
            <div className="hero-metrics">
              <div>
                <span className="metric-label">Avg wait time</span>
                <span className="metric-value">12m</span>
              </div>
              <div>
                <span className="metric-label">Patient satisfaction</span>
                <span className="metric-value">4.8</span>
              </div>
              <div>
                <span className="metric-label">Open slots</span>
                <span className="metric-value">18</span>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-card">
              <div className="hero-card-header">
                <div className="tag">Live</div>
                <div className="tag subtle">Ward B</div>
              </div>
              <div className="hero-visual">
                <svg viewBox="0 0 420 260" aria-hidden="true">
                  <defs>
                    <linearGradient id="pulse" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0" stopColor="#ff8a5b" />
                      <stop offset="1" stopColor="#5b3df6" />
                    </linearGradient>
                  </defs>
                  <rect x="20" y="20" width="380" height="220" rx="24" fill="#0d0b1a" />
                  <path
                    d="M40 150 L90 150 L120 110 L150 190 L190 90 L220 150 L270 150 L300 120 L330 170 L360 150"
                    stroke="url(#pulse)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="120" cy="110" r="8" fill="#ff8a5b" />
                  <circle cx="190" cy="90" r="8" fill="#ff8a5b" />
                  <circle cx="300" cy="120" r="8" fill="#5b3df6" />
                </svg>
              </div>
              <div className="hero-card-footer">
                <div>
                  <div className="label">Active patients</div>
                  <div className="value">42</div>
                </div>
                <div>
                  <div className="label">Critical alerts</div>
                  <div className="value warn">3</div>
                </div>
                <div>
                  <div className="label">Beds in use</div>
                  <div className="value">28/32</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-title">Total Patients</div>
            <div className="stat-value">1,234</div>
            <div className="stat-trend up">+6.4% this week</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Appointments Today</div>
            <div className="stat-value">24</div>
            <div className="stat-trend">12 upcoming • 6 in progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Available Doctors</div>
            <div className="stat-value">45</div>
            <div className="stat-trend up">+4 on shift change</div>
          </div>
        </section>

        <section className="content">
          <div className="panel">
            <div className="panel-header">
              <h2>Care Activity</h2>
              <div className="tabs">
                {['patients', 'appointments', 'doctors'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-body">
              {activeTab === 'patients' && (
                <div className="patients">
                  <form className="patient-form" onSubmit={handlePatientSubmit}>
                    <div className="form-title">Add New Patient</div>
                    <div className="form-grid">
                      <input
                        name="firstName"
                        value={patientForm.firstName}
                        onChange={handlePatientChange}
                        placeholder="First name"
                        required
                      />
                      <input
                        name="lastName"
                        value={patientForm.lastName}
                        onChange={handlePatientChange}
                        placeholder="Last name"
                        required
                      />
                      <input
                        type="email"
                        name="email"
                        value={patientForm.email}
                        onChange={handlePatientChange}
                        placeholder="Email"
                        required
                      />
                      <input
                        name="phone"
                        value={patientForm.phone}
                        onChange={handlePatientChange}
                        placeholder="Phone"
                        required
                      />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={patientForm.dateOfBirth}
                        onChange={handlePatientChange}
                        required
                      />
                      <select name="gender" value={patientForm.gender} onChange={handlePatientChange}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        name="city"
                        value={patientForm.city}
                        onChange={handlePatientChange}
                        placeholder="City"
                      />
                      <input
                        name="state"
                        value={patientForm.state}
                        onChange={handlePatientChange}
                        placeholder="State"
                      />
                      <select name="status" value={patientForm.status} onChange={handlePatientChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <button className="btn primary" type="submit" disabled={createPatient.isPending}>
                      {createPatient.isPending ? 'Saving…' : 'Save Patient'}
                    </button>
                    {hasCreateError && (
                      <div className="form-error">{createErrorMessage}</div>
                    )}
                  </form>

                  <div className="table">
                    <div className="row header">
                      <span>Patient</span>
                      <span>Status</span>
                      <span>Contact</span>
                      <span>City</span>
                    </div>
                    {isLoading && <div className="row empty">Loading patients…</div>}
                    {isError && (
                      <div className="row empty">
                        Failed to load patients{error?.message ? `: ${error.message}` : ''}.
                      </div>
                    )}
                    {!isLoading && !isError && patients.length === 0 && (
                      <div className="row empty">No patients found.</div>
                    )}
                    {!isLoading &&
                      !isError &&
                      patients.map((patient) => (
                        <div key={patient.id} className="row">
                          <span>{`${patient.firstName} ${patient.lastName}`}</span>
                          <span className={`badge ${patient.status}`}>{patient.status}</span>
                          <span>{patient.phone || patient.email}</span>
                          <span>{patient.city || '-'}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {activeTab === 'appointments' && (
                <div className="table">
                  <div className="row header">
                    <span>Time</span>
                    <span>Patient</span>
                    <span>Department</span>
                    <span>Status</span>
                  </div>
                  {[
                    ['09:30', 'A. Watts', 'Cardiology', 'Checked-in'],
                    ['10:15', 'P. Malik', 'Neurology', 'In progress'],
                    ['11:00', 'L. Rivera', 'Pediatrics', 'Scheduled']
                  ].map((row) => (
                    <div key={row[1]} className="row">
                      <span>{row[0]}</span>
                      <span>{row[1]}</span>
                      <span>{row[2]}</span>
                      <span className="badge neutral">{row[3]}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'doctors' && (
                <div className="table">
                  <div className="row header">
                    <span>Physician</span>
                    <span>Specialty</span>
                    <span>Next Slot</span>
                    <span>Queue</span>
                  </div>
                  {[
                    ['Dr. Chen', 'Pulmonology', '10:40', '2 patients'],
                    ['Dr. Gupta', 'General', '11:10', '1 patient'],
                    ['Dr. Hammond', 'Cardiology', '10:25', '3 patients']
                  ].map((row) => (
                    <div key={row[0]} className="row">
                      <span>{row[0]}</span>
                      <span>{row[1]}</span>
                      <span>{row[2]}</span>
                      <span>{row[3]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel side">
            <h2>Today’s Schedule</h2>
            <div className="schedule">
              {[
                ['09:00', 'Triage brief', 'Ward A'],
                ['10:30', 'Surgery consults', 'OR-2'],
                ['12:00', 'Pediatric rounds', 'Ward C'],
                ['15:30', 'Lab review', 'Diagnostics']
              ].map((row) => (
                <div key={row[0]} className="schedule-item">
                  <div className="time">{row[0]}</div>
                  <div>
                    <div className="title">{row[1]}</div>
                    <div className="meta">{row[2]}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="alert">
              <div className="alert-title">Critical update</div>
              <p>Pharmacy stock low for insulin. Reorder suggested.</p>
              <button className="btn small">Notify procurement</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
