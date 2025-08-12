import { supabase } from './supabase'

// Check and create bucket if it doesn't exist
export const ensureBucketExists = async (bucketName) => {
  try {
    console.log(`ensureBucketExists: Checking if ${bucketName} bucket exists...`)
    
    // First, try to list buckets to see if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('ensureBucketExists: Error listing buckets:', listError)
      // If we can't list buckets, try to access the bucket directly
      console.log('ensureBucketExists: Cannot list buckets, trying direct access...')
      
      try {
        // Try to list files in the bucket to see if it exists
        const { data: files, error: directError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 })
        
        if (directError) {
          console.error('ensureBucketExists: Direct access failed:', directError)
          return { 
            success: false, 
            exists: false, 
            error: `Bucket '${bucketName}' does not exist or you don't have access. Please create it in your Supabase dashboard under Storage.` 
          }
        } else {
          console.log('ensureBucketExists: Direct access successful, bucket exists')
          return { success: true, exists: true, directAccess: true }
        }
      } catch (directCatch) {
        console.error('ensureBucketExists: Direct access error:', directCatch)
        return { 
          success: false, 
          exists: false, 
          error: `Bucket '${bucketName}' does not exist. Please create it in your Supabase dashboard under Storage.` 
        }
      }
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    console.log(`ensureBucketExists: Bucket ${bucketName} exists:`, bucketExists)
    
    if (bucketExists) {
      console.log(`ensureBucketExists: Bucket ${bucketName} already exists`)
      return { success: true, exists: true }
    }
    
    // Bucket doesn't exist, but we can't create it from client side
    // Instead, provide helpful error message
    console.log(`ensureBucketExists: Bucket ${bucketName} does not exist`)
    console.log('ensureBucketExists: Cannot create bucket from client side')
    
    return { 
      success: false, 
      exists: false, 
      error: `Bucket '${bucketName}' does not exist. Please create it in your Supabase dashboard under Storage.` 
    }
    
  } catch (error) {
    console.error('ensureBucketExists: Failed to check bucket:', error)
    return { success: false, error: error.message }
  }
}

// Upload helper function with comprehensive error handling
export const uploadFile = async (bucketName, file, fileName = null, options = {}) => {
  try {
    console.log(`uploadFile: Starting upload to ${bucketName} bucket...`)
    console.log('uploadFile: File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Ensure bucket exists before uploading
    console.log('uploadFile: Ensuring bucket exists...')
    const bucketCheck = await ensureBucketExists(bucketName)
    
    if (!bucketCheck.success) {
      throw new Error(`Failed to ensure bucket exists: ${bucketCheck.error}`)
    }

    // Generate filename if not provided
    const finalFileName = fileName || `${Date.now()}-${file.name}`
    
    // Default upload options
    const uploadOptions = {
      upsert: true,
      contentType: file.type,
      ...options
    }
    
    console.log('uploadFile: Upload options:', uploadOptions)
    console.log('uploadFile: Starting actual upload...')
    
    // Upload file with timeout
    try {
      const uploadPromise = supabase.storage
        .from(bucketName)
        .upload(finalFileName, file, uploadOptions)
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000) // 30 second timeout
      )
      
      const { data, error } = await Promise.race([uploadPromise, timeoutPromise])
      console.log('uploadFile: Upload response received:', { data, error })
      
      if (error) {
        console.error('uploadFile: Storage upload error:', error)
        throw error
      }
    } catch (error) {
      if (error.message === 'Upload timeout') {
        console.error('uploadFile: Upload timed out after 30 seconds')
        throw new Error('Upload timed out. Please check your internet connection and try again.')
      }
      throw error
    }
    
    console.log('uploadFile: Upload successful:', data)
    
    // Get public URL
    const { data: pub } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path)
    
    const publicUrl = pub.publicUrl
    console.log('uploadFile: Public URL:', publicUrl)
    
    return {
      success: true,
      data,
      publicUrl,
      fileName: finalFileName
    }
    
  } catch (error) {
    console.error('uploadFile: Upload failed:', error)
    console.error('uploadFile: Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    return {
      success: false,
      error: error.message || 'Upload failed'
    }
  }
}

// Delete file helper
export const deleteFile = async (bucketName, filePath) => {
  try {
    console.log(`deleteFile: Deleting file from ${bucketName} bucket:`, filePath)
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])
    
    if (error) {
      console.error('deleteFile: Delete error:', error)
      throw error
    }
    
    console.log('deleteFile: File deleted successfully')
    return { success: true }
    
  } catch (error) {
    console.error('deleteFile: Delete failed:', error)
    return {
      success: false,
      error: error.message || 'Delete failed'
    }
  }
}

// Validate file helper
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 8 * 1024 * 1024, // 8MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  } = options
  
  const errors = []
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }
  
  // Check file extension (only if file has a name)
  if (file.name) {
    const extension = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get bucket configuration
export const getBucketConfig = (bucketName) => {
  const configs = {

    attachments: {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt', '.doc', '.docx']
    },
    avatars: {
      maxSize: 4 * 1024 * 1024, // 4MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
    },
    logos: {
      maxSize: 4 * 1024 * 1024, // 4MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg']
    }
  }
  
  return configs[bucketName] || configs.attachments
}

// Upload with validation
export const uploadFileWithValidation = async (bucketName, file, fileName = null, options = {}) => {
  const config = getBucketConfig(bucketName)
  const validation = validateFile(file, config)
  
  if (!validation.isValid) {
    return {
      success: false,
      error: `File validation failed: ${validation.errors.join(', ')}`
    }
  }
  
  return await uploadFile(bucketName, file, fileName, options)
} 