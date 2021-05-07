@if($item->url ?? null)
<a href="{{ $item->url }}" target="blank" rel="noopener noreferrer" title="{{ $item->title }}">
    @else
    <div class="flex">
        @endif

        @if ($item->image)
        <img src="{{ $item->image['src'] }}" alt="{{ $item->title }}" width="{{ $item->image['width'] ?? 150 }}"
            height="{{ $item->image['height'] ?? 96 }}" loading="lazy"
            style="max-height:{{ $item->image['height'] ?? 96 }}px">
        @else
        {!! $item->getContent() !!}
        <span class="sr-only">{{ $item->title }}</span>
        @endif

        @if($item->url ?? null)
</a>
@else
</div>
@endif
