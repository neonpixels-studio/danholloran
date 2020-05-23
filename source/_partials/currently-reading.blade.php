@php
$currentlyReading = $books->where('group', 'currently-reading');
@endphp

@if($currentlyReading->count() > 1)
<agile class="mb-6" :options="{fade: true,}">
@else
<div class="mb-6">
@endif
    @foreach ($currentlyReading as $book)
        <div class="flex -mx-6">
            <div class="w-1/3 px-6">
                <img
                    src="{{ $book->large_image_url }}"
                    alt="{{ $book->title }} cover"
                    class="mb-4 inline-block w-full shadow"
                    loading="lazy"
                >
            </div>
            <div class="w-2/3">
                <h3>{{ $book->title }}</h3>
                <div class="mb-4">
                    {!! $book->getExcerpt() !!}
                </div>
                <a href="{{ $book->link }}" class="button-small button-secondary">View on Goodreads</a>
            </div>
        </div>
    @endforeach
@if($currentlyReading->count() > 1)
</agile>
@else
</div>
@endif
