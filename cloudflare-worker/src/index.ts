import { Hono } from 'hono'
import { z } from 'zod'
import { validator } from 'hono/validator'
import { cors } from 'hono/cors'

// Validation schema for board image upload
const BoardImageSchema = z.object({
  imageData: z.string().min(1).refine((val) => {
    const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/
    return base64Pattern.test(val)
  }, {
    message: 'Image must be a valid base64 data URL with data:image/type;base64, prefix'
  }),
  gameResult: z.object({
    gameWon: z.boolean().optional(),
    grid: z.array(z.array(z.any())).optional(),
    followers: z.array(z.any()).optional()
  }).optional()
})

const app = new Hono<{
  Bindings: Cloudflare.Env
}>()

app.use(cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  maxAge: 3600,
}))

// Rate limiting middleware (disabled)
const rateLimitMiddleware = async (c: any, next: any) => {
  // Rate limiting disabled - allow all requests
  await next()
}

// Upload board image endpoint
app.post('/upload/board-image',
  rateLimitMiddleware,
  validator('json', (value, c) => {
    const parsed = BoardImageSchema.safeParse(value)
    if (!parsed.success) {
      return c.json({ error: 'Invalid image data', details: parsed.error.errors }, 400)
    }
    return parsed.data
  }),
  async (c) => {
    try {
      const validatedData = c.req.valid('json')
      const key = `board-images/${Date.now()}_${Math.random().toString(36).substring(7)}`

      const publicBucketUrl = c.env.PUBLIC_BUCKET_URL || 'https://your-bucket.r2.dev'

      let processedImageUrl = ''
      let imageType = 'png'
      
      try {
        const imageBase64 = validatedData.imageData
        const base64Data = imageBase64.replace(/^data:image\/([a-zA-Z]+);base64,/, '')
        imageType = imageBase64.match(/^data:image\/([a-zA-Z]+);base64,/)?.[1] || 'png'

        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
        const imageKey = `${key}.${imageType}`

        await c.env.BUCKET.put(imageKey, imageBuffer, {
          httpMetadata: {
            contentType: `image/${imageType}`,
            cacheControl: 'public, max-age=3600'
          },
          customMetadata: {
            'game-result': validatedData.gameResult?.gameWon ? 'win' : 'loss',
            'uploaded-at': new Date().toISOString(),
            'image-type': imageType
          }
        })

        processedImageUrl = `${publicBucketUrl}/${imageKey}`
      } catch (imageError) {
        console.error('Failed to process base64 image:', imageError)
        return c.json({ error: 'Image processing failed' }, 500)
      }

      return c.json({
        success: true,
        key: `${key}.${imageType}`,
        publicUrl: processedImageUrl,
        imageType: imageType,
        message: 'Board image uploaded successfully to Cloudflare R2'
      })
    } catch (error) {
      console.error('Upload error:', error)
      return c.json({ error: 'Upload failed' }, 500)
    }
  }
)

// Serve image endpoint (optional - R2 can serve directly)
app.get('/image/:key', async (c) => {
  try {
    const key = c.req.param('key')
    
    // Get the image from R2
    const object = await c.env.BUCKET.get(key)
    
    if (!object) {
      return c.json({ error: 'Image not found' }, 404)
    }

    // Return the image with proper headers
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/png',
        'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return c.json({ error: 'Failed to serve image' }, 500)
  }
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    bucket: c.env.BUCKET ? 'connected' : 'not configured'
  })
})

export default app
