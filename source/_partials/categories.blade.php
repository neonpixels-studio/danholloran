@if ($page->categories)
<div class="{{ $wrap_class ?? 'mb-4' }}">
    @foreach ($page->categories as $i => $category)
    <span href="{{ '/blog/categories/' . $category }}" title="View posts in {{ $category }}"
        class="inline-block px-3 pt-px mb-2 mr-2 text-xs font-semibold leading-loose tracking-wide text-gray-800 bg-gray-300 rounded category">{{ $category }}</span>
    @endforeach
</div>
@endif
