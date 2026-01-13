import { useParams } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { selectBlogById } from '../app/blogSlice'

export default function SinglePostPage() {
  const { id } = useParams<{ id: string }>()

  const post = useAppSelector((state) =>
    id ? selectBlogById(state, id) : undefined
  )

  if (!post) {
    return <div className="p-6">Post not found</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>

      <p className="text-sm text-gray-500 mb-4">
        By {post.email} •{' '}
        {new Date(post.created_at).toLocaleDateString()}
      </p>
      
      <p className="whitespace-pre-line">{post.content}</p>

    </div>
  )
}
