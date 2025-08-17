// Test script to check parked appointments issue
import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testParkedAppointments() {
  console.log('🔍 Testing parked appointments issue...')
  
  try {
    // Step 1: Check all appointments
    console.log('\n📋 Step 1: Fetching all appointments...')
    const { data: allAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        client_name,
        clients(full_name),
        parked,
        status,
        date,
        service_id,
        duration,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Error fetching appointments:', fetchError)
      return
    }
    
    console.log(`✅ Total appointments: ${allAppointments.length}`)
    
    // Step 2: Check parked appointments
    console.log('\n🚗 Step 2: Checking parked appointments...')
    const parkedAppointments = allAppointments.filter(apt => apt.parked === true)
    console.log(`✅ Parked appointments: ${parkedAppointments.length}`)
    
    parkedAppointments.forEach((apt, index) => {
      console.log(`\n🚗 Parked appointment ${index + 1}:`)
      console.log(`   ID: ${apt.id}`)
      console.log(`   Client: ${apt.client_name || apt.clients?.full_name || 'Unknown'}`)
      console.log(`   Parked: ${apt.parked}`)
      console.log(`   Status: ${apt.status}`)
      console.log(`   Date: ${apt.date}`)
      console.log(`   Service ID: ${apt.service_id}`)
      console.log(`   Duration: ${apt.duration}`)
      console.log(`   Updated: ${apt.updated_at}`)
    })
    
    // Step 3: Check appointments with null date
    console.log('\n📅 Step 3: Checking appointments with null date...')
    const nullDateAppointments = allAppointments.filter(apt => apt.date === null)
    console.log(`✅ Appointments with null date: ${nullDateAppointments.length}`)
    
    nullDateAppointments.forEach((apt, index) => {
      console.log(`\n📅 Null date appointment ${index + 1}:`)
      console.log(`   ID: ${apt.id}`)
      console.log(`   Client: ${apt.client_name || apt.clients?.full_name || 'Unknown'}`)
      console.log(`   Parked: ${apt.parked}`)
      console.log(`   Status: ${apt.status}`)
      console.log(`   Date: ${apt.date}`)
    })
    
    // Step 4: Check for inconsistencies
    console.log('\n🔍 Step 4: Checking for inconsistencies...')
    const inconsistentAppointments = allAppointments.filter(apt => 
      apt.parked === true && apt.date !== null
    )
    console.log(`⚠️  Inconsistent appointments (parked=true but date!=null): ${inconsistentAppointments.length}`)
    
    if (inconsistentAppointments.length > 0) {
      inconsistentAppointments.forEach((apt, index) => {
        console.log(`\n⚠️  Inconsistent appointment ${index + 1}:`)
        console.log(`   ID: ${apt.id}`)
        console.log(`   Client: ${apt.client_name || apt.clients?.full_name || 'Unknown'}`)
        console.log(`   Parked: ${apt.parked}`)
        console.log(`   Date: ${apt.date}`)
      })
    }
    
    // Step 5: Check recent updates
    console.log('\n⏰ Step 5: Checking recent updates...')
    const recentAppointments = allAppointments
      .filter(apt => {
        const updatedAt = new Date(apt.updated_at)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        return updatedAt > oneHourAgo
      })
      .slice(0, 5)
    
    console.log(`✅ Recent appointments (last hour): ${recentAppointments.length}`)
    recentAppointments.forEach((apt, index) => {
      console.log(`\n⏰ Recent appointment ${index + 1}:`)
      console.log(`   ID: ${apt.id}`)
      console.log(`   Client: ${apt.client_name || apt.clients?.full_name || 'Unknown'}`)
      console.log(`   Parked: ${apt.parked}`)
      console.log(`   Status: ${apt.status}`)
      console.log(`   Updated: ${apt.updated_at}`)
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testParkedAppointments() 