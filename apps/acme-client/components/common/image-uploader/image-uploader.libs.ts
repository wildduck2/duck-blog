export interface UploadConfig {
  apiEndpoint?: string
  maxRetries?: number
  timeout?: number
  headers?: Record<string, string>
  transformRequest?: (formData: FormData) => FormData
  transformResponse?: (response: any) => any
  onProgress?: (progress: number, fileId: string) => void
  onSuccess?: (response: any, fileId: string) => void
  onError?: (error: Error, fileId: string) => void
}

export interface CompressionConfig {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'original' | 'jpeg' | 'png' | 'webp'
  enableResize?: boolean
}

export interface FileProcessingResult {
  id: string
  originalFile: File
  processedFile?: File
  binaryData?: string
  compressionRatio?: number
  uploadResponse?: any
  error?: string
  status: 'pending' | 'processing' | 'uploading' | 'completed' | 'error'
  progress: number
}

export class ImageUploadManager {
  private files: Map<string, FileProcessingResult> = new Map()
  private uploadConfig: UploadConfig
  private compressionConfig: CompressionConfig
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(uploadConfig: UploadConfig = {}, compressionConfig: CompressionConfig = {}) {
    this.uploadConfig = {
      apiEndpoint: '/api/upload',
      maxRetries: 3,
      timeout: 30000,
      ...uploadConfig,
    }

    this.compressionConfig = {
      enableResize: true,
      format: 'original',
      maxHeight: 1080,
      maxWidth: 1920,
      quality: 0.8,
      ...compressionConfig,
    }

    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
  }

  async addFile(file: File): Promise<string> {
    const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const result: FileProcessingResult = {
      id,
      originalFile: file,
      progress: 0,
      status: 'pending',
    }

    this.files.set(id, result)

    // Start processing immediately
    this.processFile(id)

    return id
  }

  private async processFile(fileId: string): Promise<void> {
    const result = this.files.get(fileId)
    if (!result) return

    try {
      result.status = 'processing'
      this.updateProgress(fileId, 10)

      // Compress image if needed
      if (this.compressionConfig.enableResize || (this.compressionConfig.quality as number) < 1) {
        const { compressedFile, binaryData, compressionRatio } = await this.compressImage(result.originalFile)
        result.processedFile = compressedFile
        result.binaryData = binaryData
        result.compressionRatio = compressionRatio
      } else {
        result.processedFile = result.originalFile
        result.binaryData = await this.fileToBinary(result.originalFile)
      }

      this.updateProgress(fileId, 50)

      // Auto upload if configured
      if (this.uploadConfig.apiEndpoint) {
        await this.uploadFile(fileId)
      } else {
        result.status = 'completed'
        this.updateProgress(fileId, 100)
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Processing failed'
      result.status = 'error'
      this.uploadConfig.onError?.(error as Error, fileId)
    }
  }

  private async compressImage(file: File): Promise<{
    compressedFile: File
    binaryData: string
    compressionRatio: number
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        try {
          let { width, height } = img
          const originalSize = file.size

          // Calculate optimal dimensions
          if (this.compressionConfig.enableResize) {
            const maxWidth = this.compressionConfig.maxWidth as number
            const maxHeight = this.compressionConfig.maxHeight as number

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height)
              width = Math.round(width * ratio)
              height = Math.round(height * ratio)
            }
          }

          this.canvas.width = width
          this.canvas.height = height

          // High quality rendering
          this.ctx.imageSmoothingEnabled = true
          this.ctx.imageSmoothingQuality = 'high'
          this.ctx.drawImage(img, 0, 0, width, height)

          // Determine output format
          const format =
            this.compressionConfig.format === 'original'
              ? file.type
              : this.compressionConfig.format === 'webp'
                ? 'image/webp'
                : this.compressionConfig.format === 'png'
                  ? 'image/png'
                  : 'image/jpeg'

          this.canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }

              const compressedFile = new File([blob], file.name, { type: format })
              const compressionRatio = (originalSize - compressedFile.size) / originalSize

              // Convert to binary
              const reader = new FileReader()
              reader.onload = () => {
                resolve({
                  binaryData: reader.result as string,
                  compressedFile,
                  compressionRatio,
                })
              }
              reader.onerror = () => reject(new Error('Failed to read binary data'))
              reader.readAsDataURL(blob)
            },
            format,
            this.compressionConfig.quality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  private async fileToBinary(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file as binary'))
      reader.readAsDataURL(file)
    })
  }

  private async uploadFile(fileId: string): Promise<void> {
    const result = this.files.get(fileId)
    if (!result || !result.processedFile) return

    result.status = 'uploading'
    let retries = 0

    while (retries < (this.uploadConfig.maxRetries as number)) {
      try {
        const formData = new FormData()
        formData.append('file', result.processedFile)
        formData.append('fileId', fileId)
        formData.append('originalName', result.originalFile.name)
        formData.append('originalSize', result.originalFile.size.toString())

        if (result.compressionRatio) {
          formData.append('compressionRatio', result.compressionRatio.toString())
        }

        // Allow custom request transformation
        const finalFormData = this.uploadConfig.transformRequest?.(formData) || formData

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          if (result.progress < 90) {
            result.progress += Math.random() * 10 + 5
            this.uploadConfig.onProgress?.(result.progress, fileId)
          }
        }, 200)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.uploadConfig.timeout as number)

        const response = await fetch(this.uploadConfig.apiEndpoint as string, {
          body: finalFormData,
          headers: this.uploadConfig.headers,
          method: 'POST',
          signal: controller.signal,
        })

        clearInterval(progressInterval)
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
        }

        const responseData = await response.json()

        // Allow custom response transformation
        result.uploadResponse = this.uploadConfig.transformResponse?.(responseData) || responseData
        result.status = 'completed'
        result.progress = 100

        this.uploadConfig.onSuccess?.(result.uploadResponse, fileId)
        return
      } catch (error) {
        retries++
        if (retries >= (this.uploadConfig.maxRetries as number)) {
          result.error = error instanceof Error ? error.message : 'Upload failed'
          result.status = 'error'
          result.progress = 0
          this.uploadConfig.onError?.(error as Error, fileId)
          return
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
      }
    }
  }

  private updateProgress(fileId: string, progress: number): void {
    const result = this.files.get(fileId)
    if (result) {
      result.progress = Math.min(100, Math.max(0, progress))
      this.uploadConfig.onProgress?.(result.progress, fileId)
    }
  }

  getFile(fileId: string): FileProcessingResult | undefined {
    return this.files.get(fileId)
  }

  getAllFiles(): FileProcessingResult[] {
    return Array.from(this.files.values())
  }

  removeFile(fileId: string): boolean {
    const result = this.files.get(fileId)
    if (result) {
      // Clean up blob URLs
      if (result.processedFile && result.processedFile !== result.originalFile) {
        const url = URL.createObjectURL(result.processedFile)
        URL.revokeObjectURL(url)
      }
      return this.files.delete(fileId)
    }
    return false
  }

  clearAll(): void {
    this.files.forEach((result) => {
      if (result.processedFile && result.processedFile !== result.originalFile) {
        const url = URL.createObjectURL(result.processedFile)
        URL.revokeObjectURL(url)
      }
    })
    this.files.clear()
  }

  async uploadAll(): Promise<void> {
    const pendingFiles = Array.from(this.files.values()).filter((f) => f.status === 'completed' && !f.uploadResponse)

    await Promise.all(pendingFiles.map((f) => this.uploadFile(f.id)))
  }

  updateConfig(uploadConfig?: Partial<UploadConfig>, compressionConfig?: Partial<CompressionConfig>): void {
    if (uploadConfig) {
      this.uploadConfig = { ...this.uploadConfig, ...uploadConfig }
    }
    if (compressionConfig) {
      this.compressionConfig = { ...this.compressionConfig, ...compressionConfig }
    }
  }

  getStats() {
    const files = this.getAllFiles()
    return {
      averageCompressionRatio: files.reduce((sum, f) => sum + (f.compressionRatio || 0), 0) / files.length,
      completed: files.filter((f) => f.status === 'completed').length,
      errors: files.filter((f) => f.status === 'error').length,
      pending: files.filter((f) => f.status === 'pending').length,
      processing: files.filter((f) => f.status === 'processing').length,
      total: files.length,
      totalOriginalSize: files.reduce((sum, f) => sum + f.originalFile.size, 0),
      totalProcessedSize: files.reduce((sum, f) => sum + (f.processedFile?.size || f.originalFile.size), 0),
      uploading: files.filter((f) => f.status === 'uploading').length,
    }
  }
}
