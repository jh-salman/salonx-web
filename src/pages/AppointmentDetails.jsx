import React, { useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAppointments } from '../features/appointments/appointmentsSlice'
import { Clock, User, FileText, ArrowLeft } from 'lucide-react'

const selectAppointmentById = (state, id) => {
  const fromAll = state.appointments.appointments?.find(a => a.id === id)
  if (fromAll) return fromAll
  const fromActive = state.appointments.activeAppointments?.find(a => a.id === id)
  if (fromActive) return fromActive
  return state.appointments.parkedAppointments?.find(a => a.id === id)
}

export default function AppointmentDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const isLoading = useSelector(s => s.appointments.isLoading)
  const apt = useSelector(s => selectAppointmentById(s, id))

  useEffect(() => {
    if (!apt && !isLoading) {
      dispatch(fetchAppointments())
    }
  }, [apt, isLoading, dispatch])

  const timeRange = useMemo(() => {
    if (!apt) return ''
    const start = new Date(apt.date || apt.appointment_date)
    const dur = Number.isFinite(apt.duration) ? apt.duration : 60
    const end = new Date(start.getTime() + dur * 60 * 1000)
    const fmt = d => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${fmt(start)} - ${fmt(end)}`
  }, [apt])

  if (!apt) {
    return (
      <div className="min-h-screen bg-black text-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          <Link to="/calendar" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to calendar
          </Link>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            {isLoading ? 'Loading appointment…' : 'Appointment not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/calendar" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to calendar
        </Link>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="text-2xl font-bold text-white">{apt.clients?.full_name || apt.client_name || 'Unknown client'}</div>
            <div className="text-gray-300">{apt.services?.name || apt.service_name || 'No service'}</div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm text-gray-400">Time</div>
                  <div className="text-white">{timeRange}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm text-gray-400">Client</div>
                  <div className="text-white">{apt.clients?.full_name || apt.client_name || 'Unknown'}</div>
                  {apt.clients?.phone && <div className="text-gray-300">{apt.clients.phone}</div>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm text-gray-400">Service</div>
                  <div className="text-white">{apt.services?.name || apt.service_name || 'No service'}</div>
                  <div className="text-gray-300">Duration: {apt.duration || 60} min • ${apt.price || 0}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">Notes</div>
              <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 min-h-[120px] whitespace-pre-wrap">
                {apt.notes || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}