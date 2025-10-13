'use client'

import { Badge } from '@acme/ui/badge'
import { Button } from '@acme/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@acme/ui/card'
import { Label } from '@acme/ui/label'
import { Progress } from '@acme/ui/progress'
import { Switch } from '@acme/ui/switch'
import { cn } from '@gentleduck/libs/cn'
import {
  AlertCircle,
  BarChart3,
  Binary,
  Check,
  Cloud,
  Copy,
  Crop,
  Eye,
  ImageIcon,
  Loader2,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  type CompressionConfig,
  type FileProcessingResult,
  ImageUploadManager,
  type UploadConfig,
} from './image-uploader.libs'

interface EnhancedImageUploadProps {
  onFilesChange?: (files: FileProcessingResult[]) => void
  onUploadComplete?: (responses: any[]) => void
  multiple?: boolean
  maxSizeMB?: number
  maxFiles?: number
  className?: string
  disabled?: boolean
  accept?: Record<string, string[]>
  uploadConfig?: UploadConfig
  compressionConfig?: CompressionConfig
}

export function EnhancedImageUpload({
  onFilesChange,
  onUploadComplete,
  multiple = true,
  maxSizeMB = 10,
  maxFiles = 5,
  className,
  disabled = false,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'] },
  uploadConfig = {},
  compressionConfig = {},
}: EnhancedImageUploadProps) {
  const [files, setFiles] = useState<FileProcessingResult[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showBinary, setShowBinary] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const managerRef = useRef<ImageUploadManager>(new ImageUploadManager(uploadConfig, compressionConfig))

  useEffect(() => {
    const config: UploadConfig = {
      ...uploadConfig,
      onError: (error, fileId) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, error: error.message, progress: 0, status: 'error' as const } : f,
          ),
        )
        uploadConfig.onError?.(error, fileId)
      },
      onProgress: (progress, fileId) => {
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))
        uploadConfig.onProgress?.(progress, fileId)
      },
      onSuccess: (response, fileId) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: 'completed' as const, uploadResponse: response } : f)),
        )
        uploadConfig.onSuccess?.(response, fileId)

        // Check if all uploads are complete
        const allFiles = managerRef.current?.getAllFiles() || []
        const completedUploads = allFiles.filter((f) => f.uploadResponse)
        if (completedUploads.length === allFiles.length) {
          onUploadComplete?.(completedUploads.map((f) => f.uploadResponse))
        }
      },
    }

    managerRef.current = new ImageUploadManager(config, compressionConfig)

    return () => {
      managerRef.current?.clearAll()
    }
  }, [uploadConfig, compressionConfig, onUploadComplete])

  const syncFiles = useCallback(() => {
    if (managerRef.current) {
      const allFiles = managerRef.current.getAllFiles()
      setFiles(allFiles)
      onFilesChange?.(allFiles)
    }
  }, [onFilesChange])

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (disabled || !managerRef.current) return

      setIsUploading(true)

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          errors.forEach((error: any) => {
            console.error(`File ${file.name}: ${error.message}`)
          })
        })
      }

      // Filter valid files
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          console.error(`File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) {
        setIsUploading(false)
        return
      }

      try {
        const currentFiles = managerRef.current.getAllFiles()
        const remainingSlots = multiple ? Math.max(0, maxFiles - currentFiles.length) : 1
        const filesToAdd = validFiles.slice(0, remainingSlots)

        if (!multiple) {
          // Clear existing files for single mode
          managerRef.current.clearAll()
        }

        // Add files to manager
        for (const file of filesToAdd) {
          await managerRef.current.addFile(file)
        }

        syncFiles()
      } catch (error) {
        console.error('Failed to add files:', error)
      }

      setTimeout(() => setIsUploading(false), 500)
    },
    [disabled, maxSizeMB, maxFiles, multiple, syncFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    disabled,
    multiple,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDrop,
  })

  const removeAt = useCallback(
    (idx: number) => {
      const fileToRemove = files[idx]
      if (fileToRemove && managerRef.current) {
        managerRef.current.removeFile(fileToRemove.id)
        syncFiles()
      }
    },
    [files, syncFiles],
  )

  const clearAll = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearAll()
      setFiles([])
      onFilesChange?.([])
    }
  }, [onFilesChange])

  const copyBinaryData = useCallback(async (binaryData: string) => {
    try {
      await navigator.clipboard.writeText(binaryData)
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy binary data:', error)
    }
  }, [])

  const triggerUpload = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.uploadAll()
      syncFiles()
    }
  }, [syncFiles])

  const hasFiles = files.length > 0
  const canAddMore = multiple && files.length < maxFiles
  const stats = managerRef.current?.getStats()

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Advanced Settings */}
      <Card className="border-0 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch checked={showBinary} id="binary-output" onCheckedChange={setShowBinary} />
              <Label className="text-xs" htmlFor="binary-output">
                Show Binary Data
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={showStats} id="show-stats" onCheckedChange={setShowStats} />
              <Label className="text-xs" htmlFor="show-stats">
                Show Statistics
              </Label>
            </div>
          </div>

          {uploadConfig.apiEndpoint && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Cloud className="h-3 w-3" />
                API Upload: {uploadConfig.apiEndpoint}
              </div>
              <Button disabled={!hasFiles} onClick={triggerUpload} size="sm" variant="outline">
                Upload All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {showStats && stats && (
        <Card className="border-0 bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
              <div className="text-center">
                <div className="font-medium text-lg">{stats.total}</div>
                <div className="text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600 text-lg">{stats.completed}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-lg">
                  {(((stats.totalOriginalSize - stats.totalProcessedSize) / stats.totalOriginalSize) * 100).toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Space Saved</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-lg">{(stats.totalProcessedSize / 1024 / 1024).toFixed(2)}MB</div>
                <div className="text-muted-foreground">Total Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main upload area */}
      <div
        {...getRootProps()}
        className={cn(
          'group relative cursor-pointer transition-all duration-300 ease-out',
          'rounded-xl border-2 border-dashed',
          'hover:border-primary/50 hover:bg-accent/30',
          isDragActive || isDragOver ? 'scale-[1.02] border-primary bg-primary/10 shadow-lg' : 'border-border',
          disabled && 'cursor-not-allowed opacity-50',
          hasFiles && !multiple ? 'h-80' : 'min-h-[200px]',
          'overflow-hidden',
        )}>
        <input {...getInputProps()} />

        {/* Background gradient animation */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5',
            'opacity-0 transition-opacity duration-500',
            (isDragActive || isDragOver) && 'opacity-100',
          )}
        />

        {/* Single file preview mode */}
        {!multiple && hasFiles && (
          <div className="group relative h-full w-full">
            <img
              alt="Preview"
              className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
              height={200}
              src={
                files[0].uploadResponse?.processedImageUrl ||
                URL.createObjectURL(files[0].processedFile || files[0].originalFile)
              }
              width={200}
            />

            <div className="absolute top-3 left-3 flex gap-2">
              {files[0].compressionRatio && (
                <Badge className="text-xs" variant="secondary">
                  Compressed {Math.round(files[0].compressionRatio * 100)}%
                </Badge>
              )}
              {files[0].status === 'completed' && files[0].uploadResponse && (
                <Badge className="text-xs" variant="default">
                  <Cloud className="mr-1 h-3 w-3" />
                  Uploaded
                </Badge>
              )}
            </div>

            {/* Upload progress overlay - FIXED: Only show during upload, hide when complete */}
            {files[0].status === 'uploading' && files[0].progress < 100 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                <div className="text-center text-white">
                  <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                  <div className="font-medium text-sm">{Math.round(files[0].progress)}%</div>
                  <Progress className="mt-2 w-32" value={files[0].progress} />
                </div>
              </div>
            )}

            {/* Success overlay - FIXED: Show briefly then fade out */}
            {files[0].status === 'completed' && files[0].progress === 100 && (
              <div className="absolute inset-0 flex animate-[fadeIn_0.5s_ease-out,fadeOut_0.5s_ease-out_2s_forwards] items-center justify-center rounded-lg bg-green-500/20">
                <div className="animate-[bounceIn_0.6s_ease-out] rounded-full bg-green-500 p-3 text-white">
                  <Check className="h-6 w-6" />
                </div>
              </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
              {files[0].binaryData && (
                <Button
                  className="h-8 w-8 rounded-full hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyBinaryData(files[0].binaryData!)
                  }}
                  size="icon"
                  type="button"
                  variant="secondary">
                  <Binary className="h-4 w-4" />
                </Button>
              )}
              {files[0].uploadResponse?.url && (
                <Button
                  className="h-8 w-8 rounded-full hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(files[0].uploadResponse!.url, '_blank')
                  }}
                  size="icon"
                  type="button"
                  variant="secondary">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                className="h-8 w-8 rounded-full hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(0)
                }}
                size="icon"
                type="button"
                variant="destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty state or multiple files mode */}
        {(!hasFiles || multiple) && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            {/* Upload icon with animation */}
            <div
              className={cn(
                'relative mb-4 transition-all duration-300',
                isDragActive || isDragOver ? 'scale-110' : 'scale-100',
              )}>
              <div
                className={cn(
                  'rounded-full p-4 transition-all duration-300',
                  isDragActive || isDragOver ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Upload
                    className={cn(
                      'h-8 w-8 transition-transform duration-300',
                      isDragActive || (isDragOver && 'animate-bounce'),
                    )}
                  />
                )}
              </div>

              {/* Pulse ring animation */}
              {(isDragActive || isDragOver) && (
                <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/30" />
              )}
            </div>

            {/* Text content */}
            <div className="space-y-2">
              <p
                className={cn(
                  'font-medium text-lg transition-colors duration-200',
                  isDragActive || isDragOver ? 'text-primary' : 'text-foreground',
                )}>
                {isDragActive ? 'Drop your images here!' : 'Drag & drop images here'}
              </p>
              <p className="text-muted-foreground text-sm">
                or <span className="font-medium text-primary hover:underline">browse files</span>
              </p>
              <p className="text-muted-foreground text-xs">
                Supports: {Object.values(accept).flat().join(', ')} • Max: {maxSizeMB}MB each
                {multiple && ` • Up to ${maxFiles} files`}
              </p>
            </div>

            {/* File count indicator */}
            {multiple && hasFiles && (
              <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
                <ImageIcon className="h-4 w-4" />
                <span>
                  {files.length} of {maxFiles} files
                </span>
              </div>
            )}
          </div>
        )}

        {/* Multiple files preview grid */}
        {multiple && hasFiles && (
          <div className="absolute right-4 bottom-4 left-4">
            <div className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex gap-2 overflow-x-auto pb-2">
              {files.map((file, idx) => (
                <div
                  className="group relative flex-shrink-0 animate-[slideInUp_0.3s_ease-out]"
                  key={file.id}
                  style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-white shadow-lg">
                    <img
                      alt={`Preview ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                      height={200}
                      src={
                        file.uploadResponse?.processedImageUrl ||
                        URL.createObjectURL(file.processedFile || file.originalFile)
                      }
                      width={200}
                    />

                    <div className="absolute top-1 left-1 flex gap-1">
                      {file.compressionRatio && (
                        <div className="rounded bg-blue-500 p-0.5 text-white text-xs">
                          <Crop className="h-2 w-2" />
                        </div>
                      )}
                      {file.status === 'completed' && file.uploadResponse && (
                        <div className="rounded bg-green-500 p-0.5 text-white text-xs">
                          <Cloud className="h-2 w-2" />
                        </div>
                      )}
                    </div>

                    {/* Upload progress - FIXED: Only show during upload */}
                    {file.status === 'uploading' && file.progress < 100 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="font-medium text-white text-xs">{Math.round(file.progress)}%</div>
                        <div className="absolute right-0 bottom-0 left-0 h-1 bg-white/20">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Success indicator - FIXED: Show briefly then fade */}
                    {file.status === 'completed' && file.progress === 100 && (
                      <div className="absolute top-1 right-1 animate-[fadeIn_0.5s_ease-out,fadeOut_0.5s_ease-out_2s_forwards]">
                        <div className="rounded-full bg-green-500 p-1 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      className="-top-2 -right-2 absolute rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 shadow-lg transition-all duration-200 hover:scale-110 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeAt(idx)
                      }}
                      type="button">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add more button */}
              {canAddMore && (
                <div className="flex h-20 w-20 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-muted-foreground/30 border-dashed text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary">
                  <div className="text-center">
                    <Upload className="mx-auto mb-1 h-4 w-4" />
                    <span className="text-xs">Add</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Information */}
      {hasFiles && (
        <Card className="border-0 bg-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">File Information</CardTitle>
              <Button className="h-7 bg-transparent text-xs" onClick={clearAll} size="sm" variant="outline">
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file, idx) => (
              <div className="flex items-center justify-between rounded-lg bg-background/50 p-2" key={file.id}>
                <div className="flex items-center gap-3">
                  <img
                    alt="Image Preview"
                    className="h-8 w-8 rounded object-cover"
                    height={400}
                    src={URL.createObjectURL(file.processedFile || file.originalFile)}
                    width={800}
                  />
                  <div className="space-y-1 text-xs">
                    <div className="max-w-[200px] truncate font-medium">{file.originalFile.name}</div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{((file.processedFile?.size || file.originalFile.size) / 1024 / 1024).toFixed(2)} MB</span>
                      {file.compressionRatio && (
                        <Badge className="px-1 py-0 text-xs" variant="outline">
                          -{Math.round(file.compressionRatio * 100)}%
                        </Badge>
                      )}
                      <Badge
                        className="px-1 py-0 text-xs"
                        variant={
                          file.status === 'completed'
                            ? 'default'
                            : file.status === 'error'
                              ? 'destructive'
                              : file.status === 'uploading'
                                ? 'secondary'
                                : 'outline'
                        }>
                        {file.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {file.binaryData && showBinary && (
                    <Button
                      className="h-6 w-6"
                      onClick={() => copyBinaryData(file.binaryData!)}
                      size="icon"
                      variant="ghost">
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  {file.uploadResponse?.url && (
                    <Button
                      className="h-6 w-6"
                      onClick={() => window.open(file.uploadResponse!.url, '_blank')}
                      size="icon"
                      variant="ghost">
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => removeAt(idx)}
                    size="icon"
                    variant="ghost">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Binary Data Display */}
      {showBinary && hasFiles && files.some((f) => f.binaryData) && (
        <Card className="border-0 bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Binary className="h-4 w-4" />
              Binary Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {files
                .filter((f) => f.binaryData)
                .map((file) => (
                  <div className="space-y-1" key={file.id}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs">{file.originalFile.name}</span>
                      <Button
                        className="h-6 bg-transparent text-xs"
                        onClick={() => copyBinaryData(file.binaryData!)}
                        size="sm"
                        variant="outline">
                        Copy
                      </Button>
                    </div>
                    <div className="max-h-20 overflow-y-auto break-all rounded bg-background/50 p-2 font-mono text-xs">
                      {file.binaryData?.substring(0, 200)}...
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error messages */}
      {files.some((f) => f.error) && (
        <div className="mt-3 space-y-1">
          {files
            .filter((f) => f.error)
            .map((file) => (
              <div className="flex items-center gap-2 text-destructive text-sm" key={file.id}>
                <AlertCircle className="h-4 w-4" />
                <span>{file.error}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
