import axios from 'axios'
import { toast } from 'sonner'

const server_api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/v1/`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
})

server_api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Unauthorized')

      // Handle unauthorized (e.g., redirect to login)
      // TEST: this case should throw in the client
      // router.push('/auth/signin')
      location.href = '/auth/signin'
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  },
)

export { server_api }
