// Test script to check parked appointments
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testParkedAppointments() {
  console.log('Testing parked appointments...')
  
  try {
    // Fetch all appointments
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching appointments:', error)
      return
    }
    
    console.log('Total appointments:', appointments.length)
    
    // Check parked appointments
    const parkedAppointments = appointments.filter(apt => apt.parked === true)
    console.log('Parked appointments:', parkedAppointments.length)
    
    parkedAppointments.forEach((apt, index) => {
      console.log(`Parked appointment ${index + 1}:`, {
        id: apt.id,
        client_name: apt.client_name,
        parked: apt.parked,
        date: apt.date,
        service_id: apt.service_id,
        duration: apt.duration,
        status: apt.status
      })
    })
    
    // Check appointments with null date
    const nullDateAppointments = appointments.filter(apt => apt.date === null)
    console.log('Appointments with null date:', nullDateAppointments.length)
    
    nullDateAppointments.forEach((apt, index) => {
      console.log(`Null date appointment ${index + 1}:`, {
        id: apt.id,
        client_name: apt.client_name,
        parked: apt.parked,
        date: apt.date,
        service_id: apt.service_id,
        duration: apt.duration,
        status: apt.status
      })
    })
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testParkedAppointments() 