import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getFiles, uploadFiles, getFileDownloadUrl, deleteFile } from '../../api'

function Files() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['files'],
    queryFn: () => getFiles({ limit: 20 }).then((r) => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: (formData) => uploadFiles(formData),
    onSuccess: () => {
      toast.success('File uploaded')
      queryClient.invalidateQueries({ queryKey: ['files'] })
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFile(id),
    onSuccess: () => {
      toast.success('File deleted')
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete file'),
  })

  const handleUpload = (e) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    uploadMutation.mutate(formData)
  }

  const files = data?.data || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Files</h1>

      <form onSubmit={handleUpload} className="bg-white p-5 rounded-lg shadow-sm flex gap-3 items-center">
        <input
          ref={fileInputRef}
          type="file"
          className="border rounded px-3 py-2 flex-1"
        />
        <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Upload</button>
      </form>

      {isLoading && <p className="text-gray-500">Loading files...</p>}
      {error && <p className="text-red-500">Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    No files uploaded yet
                  </td>
                </tr>
              )}
              {files.map((f) => (
                <tr key={f.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{f.originalName || f.filename || '—'}</td>
                  <td className="px-4 py-2">
                    {f.size ? `${(f.size / 1024).toFixed(1)} KB` : '—'}
                  </td>
                  <td className="px-4 py-2">{f.uploadedBy?.name || '—'}</td>
                  <td className="px-4 py-2 flex gap-3">
                    <a
                      href={getFileDownloadUrl(f.id)}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate(f.id)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Files
