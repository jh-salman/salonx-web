// Test script to check Supabase storage bucket status
import { createClient } from '@supabase/supabase-js'

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBucket() {
  console.log('Testing Supabase storage access...')
  
  try {
    // Test 1: List buckets
    console.log('1. Listing buckets...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError)
      return
    }
    
    console.log('✅ Available buckets:', buckets?.map(b => b.name) || [])
    
    // Test 2: Check if branding bucket exists
    const hasBrandingBucket = buckets?.some(b => b.name === 'branding')
    console.log('2. Branding bucket exists:', hasBrandingBucket ? '✅ Yes' : '❌ No')
    
    // Test 3: Try to access branding bucket directly
    if (hasBrandingBucket) {
      console.log('3. Testing branding bucket access...')
      const { data: files, error: listError } = await supabase.storage
        .from('branding')
        .list()
      
      if (listError) {
        console.error('❌ Failed to list files in branding bucket:', listError)
      } else {
        console.log('✅ Branding bucket accessible, files:', files?.length || 0)
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testBucket() 