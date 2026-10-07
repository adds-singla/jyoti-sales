export default function SkeletonCard() {
  return (
    <div className="glass rounded-card overflow-hidden border border-hairline/10">
      <div className="aspect-square skeleton-shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 rounded skeleton-shimmer" />
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-2/3 rounded skeleton-shimmer" />
        <div className="h-5 w-1/2 rounded skeleton-shimmer mt-2" />
      </div>
    </div>
  )
}
