@if ($item->collectionName === 'twitter' && !str_contains($item->getContent(), 'instagram.com'))
    <div class="bg-white shadow px-4 py-2 rounded text-gray-800">
        {!! $item->getContent() !!}
    </div>
@endif

@if ($item->collectionName === 'instagram')
    {!! $item->getContent() !!}
@endif

@if ($item->collectionName === 'youtube')
    <div>
        <img
            src="https://img.youtube.com/vi/{{  $item->id  }}/0.jpg"
            alt="{{ $item->title }} thumbnail"
            class="object-fit"
        >
    </div>
@endif
