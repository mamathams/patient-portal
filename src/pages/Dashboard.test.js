import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  mutateAsync: vi.fn(),
  createPatientState: {
    isPending: false,
    error: null
  },
  patientsState: {
    data: {
      data: [
        {
          id: 'p-1',
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+1-555-0100',
          email: 'jane@example.com',
          city: 'Bengaluru',
          status: 'active'
        }
      ]
    },
    isLoading: false,
    isError: false,
    error: null
  }
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mocks.invalidateQueries
    })
  }
})

vi.mock('../hooks/useAPI', () => ({
  useCreatePatient: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: mocks.createPatientState.isPending,
    error: mocks.createPatientState.error
  }),
  usePatients: () => ({
    data: mocks.patientsState.data,
    isLoading: mocks.patientsState.isLoading,
    isError: mocks.patientsState.isError,
    error: mocks.patientsState.error
  })
}))

import Dashboard from './Dashboard'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const setElementValue = (element, value) => {
  const proto = element.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value')
  descriptor.set.call(element, value)
}

const setInput = (container, name, value) => {
  const element = container.querySelector(`[name="${name}"]`)
  setElementValue(element, value)
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('Dashboard', () => {
  let container
  let root

  beforeEach(() => {
    mocks.mutateAsync.mockReset()
    mocks.invalidateQueries.mockReset()
    mocks.createPatientState.isPending = false
    mocks.createPatientState.error = null
    mocks.patientsState.isLoading = false
    mocks.patientsState.isError = false
    mocks.patientsState.error = null
    mocks.patientsState.data = {
      data: [
        {
          id: 'p-1',
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+1-555-0100',
          email: 'jane@example.com',
          city: 'Bengaluru',
          status: 'active'
        }
      ]
    }

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('renders key dashboard content', () => {
    act(() => {
      root.render(React.createElement(Dashboard))
    })

    expect(container.textContent).toContain('Hospital Management')
    expect(container.textContent).toContain('Total Patients')
    expect(container.textContent).toContain('Add New Patient')
  })

  it('switches to appointments and doctors tabs', () => {
    act(() => {
      root.render(React.createElement(Dashboard))
    })

    const tabs = Array.from(container.querySelectorAll('button.tab'))
    const appointmentsTab = tabs.find((button) => button.textContent === 'appointments')
    const doctorsTab = tabs.find((button) => button.textContent === 'doctors')

    act(() => {
      appointmentsTab.click()
    })
    expect(container.textContent).toContain('Cardiology')

    act(() => {
      doctorsTab.click()
    })
    expect(container.textContent).toContain('Dr. Chen')
  })

  it('submits normalized patient payload and refreshes patients', async () => {
    mocks.mutateAsync.mockResolvedValueOnce({})

    await act(async () => {
      root.render(React.createElement(Dashboard))
    })

    await act(async () => {
      setInput(container, 'firstName', '  Mamatha ')
      setInput(container, 'lastName', '  Gowda ')
      setInput(container, 'email', '  MAMATHA@EXAMPLE.COM ')
      setInput(container, 'phone', ' 8105067916 ')
      setInput(container, 'dateOfBirth', '1997-06-08')
      setInput(container, 'city', '  Bengaluru ')
      setInput(container, 'state', '  Karnataka ')
    })

    const form = container.querySelector('form.patient-form')
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(mocks.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Mamatha',
        lastName: 'Gowda',
        email: 'mamatha@example.com',
        phone: '8105067916',
        dateOfBirth: '1997-06-08',
        city: 'Bengaluru',
        state: 'Karnataka'
      })
    )
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['patients'] })
  })

  it('shows backend error message when create patient fails', async () => {
    mocks.mutateAsync.mockRejectedValueOnce({
      response: {
        data: {
          errors: [{ message: '"email" must be a valid email' }]
        }
      }
    })

    await act(async () => {
      root.render(React.createElement(Dashboard))
    })

    await act(async () => {
      setInput(container, 'firstName', 'Mamatha')
      setInput(container, 'lastName', 'Gowda')
      setInput(container, 'email', 'bad-email')
      setInput(container, 'phone', '8105067916')
      setInput(container, 'dateOfBirth', '1997-06-08')
    })

    const form = container.querySelector('form.patient-form')
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(container.textContent).toContain('"email" must be a valid email')
  })

  it('shows loading state while patients are being fetched', () => {
    mocks.patientsState.isLoading = true
    mocks.patientsState.data = undefined

    act(() => {
      root.render(React.createElement(Dashboard))
    })

    expect(container.textContent).toContain('Loading patients')
  })

  it('shows API error state when patient list request fails', () => {
    mocks.patientsState.isError = true
    mocks.patientsState.error = { message: 'boom' }

    act(() => {
      root.render(React.createElement(Dashboard))
    })

    expect(container.textContent).toContain('Failed to load patients: boom')
  })

  it('shows empty state when no patients are returned', () => {
    mocks.patientsState.data = { data: [] }

    act(() => {
      root.render(React.createElement(Dashboard))
    })

    expect(container.textContent).toContain('No patients found.')
  })

  it('shows pending button state and generic submit error fallback', async () => {
    mocks.createPatientState.isPending = true
    mocks.mutateAsync.mockRejectedValueOnce(new Error('network down'))

    await act(async () => {
      root.render(React.createElement(Dashboard))
    })

    expect(container.textContent).toContain('Saving')

    await act(async () => {
      setInput(container, 'firstName', 'Mamatha')
      setInput(container, 'lastName', 'Gowda')
      setInput(container, 'email', 'mamatha@example.com')
      setInput(container, 'phone', '8105067916')
      setInput(container, 'dateOfBirth', '1997-06-08')
    })

    const form = container.querySelector('form.patient-form')
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(container.textContent).toContain('network down')
  })
})
