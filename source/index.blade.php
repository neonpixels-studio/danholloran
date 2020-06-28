@extends('_layouts.master')

@section('body')
{{-- Hero --}}
<div class="container flex flex-row-reverse justify-center max-w-4xl px-6 mx-auto mb-10 md:items-center md:flex-row">
    <div>
        <h1>
            Hello, I'm <span class="text-theme-1-500">Dan Holloran</span>. I'm a <span class="text-theme-1-500">Full
                Stack
                Developer</span>.
        </h1>
    </div>
    <img loading="lazy" src="{{ '//www.gravatar.com/avatar/' . md5("dtholloran@gmail.com") . '?s=256' }}" width="256"
        height="256" alt="About image"
        class="w-24 h-24 mr-4 bg-contain rounded-full md:h-64 md:w-64 md:my-6 md:ml-10 md:mr-0">
</div>

{{-- Projects --}}
<div class="py-10">
    <div class="container px-6 mx-auto">
        <h2>Projects</h2>
        <ul class="flex flex-wrap justify-center -mx-4 -mb-6">
            @foreach ($projects->reject(function($project) {
            return (bool) $project->draft ?? false;
            }) as $project)
            <li class="px-4 mb-6 lg:w-1/3 sm:w-1/2 w-full">
                <div class="flex flex-col w-full h-full overflow-hidden bg-white rounded-lg shadow">
                    <a href="{{ $project->getUrl() }}" class="block w-full">
                        <img loading="lazy" src="{{ $project->thumbnail_image }}" alt="{{ $project->title }} thumbnail"
                            class="object-cover w-full" width="408" height="189">
                    </a>
                    <div class="px-6 py-6 mb-auto">
                        <h3 class="mb-0 text-lg">
                            <a class="text-gray-900" href="{{ $project->getUrl() }}">
                                {{ $project->title }}
                            </a>
                        </h3>
                        <div class="mb-4">
                            @include('_partials.production-url', [
                            'page' => $project,
                            ])
                            @if($project->built_at)
                            <span class="block text-xs">
                                Built @ <strong>{{ $project->built_at }}</strong>
                            </span>
                            @endif
                        </div>

                        @include('_partials.categories', [
                        'page' => $project,
                        'wrap_class' => 'mb-0',
                        ])
                    </div>
                    <a href="{{ $project->getUrl() }}"
                        class="w-full text-sm rounded-t-none shadow-none button button-primary">About
                        {{ $project->title }}</a>
                </div>
            </li>
            @endforeach
        </ul>
    </div>
</div>

{{-- Skills &amp; Tools --}}
<div class="skills-tools container px-6 mx-auto my-16">
    <ul class="flex flex-wrap -mx-1">
        @foreach ($skills->reject(function($item) {
        return (bool) $item->draft ?? false;
        }) as $item)
        <li class="flex items-center justify-center w-1/2 px-4 py-6 md:w-1/4 lg:w-1/5 sm:w-1/3">
            @if($item->url ?? null)
            <a href="{{ $item->url }}" target="blank" rel="noopener noreferrer">
                {!! $item->getContent() !!}
                <span class="sr-only">{{ $item->title }}</span>
            </a>
            @else
            <div class="flex">
                {!! $item->getContent() !!}
                <span class="sr-only">{{ $item->title }}</span>
            </div>
            @endif
        </li>
        @endforeach
    </ul>
    <div class="pt-8 text-center">
        <a href="/badges/" class="inline-flex button button-secondary button-large">
            Development Merit Badges
        </a>
    </div>
</div>

{{-- Experience --}}
<div class="py-10 bg-gray-100">
    <div class="container max-w-4xl px-6 mx-auto" v-cloak>
        <agile class="mb-6" :options="{
                    fade: true,
                }">
            @foreach ($experience->reject(function($item) {
            return (bool) $item->draft ?? false;
            }) as $item)
            <div class="slide">
                <div>
                    <h3 class="mb-0">{{ $item->title }}</h3>
                    <h4 class="mt-0 mb-0">
                        <a href="{{ $item->company_url }}" target="_blank"
                            rel="noopener noreferrer">{{ $item->company }}</a>
                    </h4>
                    <span>{{ $item->start }} - {{ $item->end }}</span>
                    <div>
                        {!! $item->getContent() !!}
                    </div>
                </div>
            </div>
            @endforeach
        </agile>

        <div class="text-center">
            <a href="{{ $page->resumeUrl }}" class="inline-flex button button-primary button-large" target="_blank"
                rel="noopener noreferrer">
                My Resume
                <span class="h-5 ml-2">
                    @include('_partials.icon-download-outline')
                </span>
            </a>
        </div>
    </div>
</div>

{{-- Get in touch --}}
<div id="contact" class="py-10 text-white bg-theme-1-800">
    <div class="container max-w-4xl px-6 mx-auto">
        <h2 class="text-white">Get in touch</h2>
        @include('_partials.contact-form')
    </div>
</div>

{{-- Featured Pages --}}
<div class="container flex flex-wrap max-w-4xl px-6 py-10 mx-auto">
    @foreach ($pages->where('featured', true)->whereNotNull('cover_image') as $featuredPage)
    <a href="{{ $featuredPage->getUrl() }}" class="relative block h-64 md:w-1/2">
        <h3 class="absolute inset-0 flex items-center justify-center m-0 text-white z-10">
            {{ $featuredPage->title }}
        </h3>
        <div class="absolute bg-theme-1-400 inset-0 opacity-75 z-0"></div>
        <img loading="lazy" src="{{ $featuredPage->cover_image }}" alt="{{ $featuredPage->title }} image"
            class="object-cover w-full h-full max-h-full">
    </a>
    @endforeach
</div>

{{-- Podcasts --}}
<div class="py-10" id="podcasts">
    <div class="container px-6 mx-auto">
        <h2>Podcasts</h2>
        <ul class="flex flex-wrap">
            <li class="w-1/2 md:w-1/3 lg:w-1/4">
                <a href="https://www.dancarlin.com/hardcore-history-series/" target="_blank" rel="noopener noreferrer"
                    class="block w-full h-full">
                    <img loading="lazy" src="/assets/img/hardcore-history.jpeg" alt="Hardcore History" width="255"
                        height="255" class="object-cover w-full h-full">
                </a>
            </li>
            <li class="w-1/2 md:w-1/3 lg:w-1/4">
                <a href="https://t.co/DDLcgLLHwD?amp=1" target="_blank" rel="noopener noreferrer"
                    class="block w-full h-full">
                    <img loading="lazy" src="/assets/img/nptm.jpg" alt="No Plans to Merge" width="255" height="255"
                        class="object-cover w-full h-full">
                </a>
            </li>
            <li class="w-1/2 md:w-1/3 lg:w-1/4">
                <a href="https://softskills.audio/" target="_blank" rel="noopener noreferrer"
                    class="block w-full h-full">
                    <img loading="lazy" src="/assets/img/soft-skills.png" alt="Soft Skills Engineering" width="255"
                        height="255" class="object-cover w-full h-full">
                </a>
            </li>
            <li class="w-1/2 md:w-1/3 lg:w-1/4">
                <a href="https://samharris.org/podcast/" target="_blank" rel="noopener noreferrer"
                    class="block w-full h-full">
                    <img loading="lazy" src="/assets/img/making-sense.png" alt="Making Sense With Sam Harris"
                        width="255" height="255" class="object-cover w-full h-full">
                </a>
            </li>
            <li class="w-1/2 md:w-1/3 lg:w-1/4">
                <a href="http://www.fullstackradio.com/" target="_blank" rel="noopener noreferrer"
                    class="block w-full h-full">
                    <img loading="lazy" src="/assets/img/fullstack-radio.jpeg" alt="Fullstack Radio" width="255"
                        height="255" class="object-cover w-full h-full">
                </a>
            </li>
            <li class="w-1/2 md:w-1/3 lg:w-1/4">
                <a href="https://laravel-news.com/podcast/" target="_blank" rel="noopener noreferrer"
                    class="block w-full h-full">
                    <img loading="lazy" src="/assets/img/laravel-news-podcast.png" alt="Laravel News Podcast"
                        width="255" height="255" class="object-cover w-full h-full">
                </a>
            </li>
            <li class="w-1/2 md:w-1/3 lg:w-1/4">
                <a href="https://www.redhat.com/en/command-line-heroes" target="_blank" rel="noopener noreferrer"
                    class="block w-full h-full">
                    <img loading="lazy" src="/assets/img/commandline-heros.jpeg" alt="Commandline Heros" width="255"
                        height="255" class="object-cover w-full h-full">
                </a>
            </li>
            <li class="w-1/2 md:w-1/3 lg:w-1/4">
                <a href="https://shoptalkshow.com/" target="_blank" rel="noopener noreferrer"
                    class="block w-full h-full">
                    <img loading="lazy" src="/assets/img/shoptalk-show.png" alt="Shoptalk Show" width="255" height="255"
                        class="object-cover w-full h-full">
                </a>
            </li>
        </ul>
    </div>
</div>

{{-- Books --}}
<div class="container max-w-4xl px-6 pt-10 mx-auto py-10">
    <h2>What I'm Reading</h2>
    @include('_partials.currently-reading')

    <div class="text-center">
        <a href="/books" class="button button-secondary button-large">View All</a>
    </div>
</div>

{{-- Around the Web --}}
<div class="py-10 text-white">
    <div class="container px-6 mx-auto">
        <div class="flex flex-wrap -mx-2">
            @foreach ($twitter->filter(function ($item) {
            return !str_contains($item->getContent(), 'instagram.com');
            })->concat($youtube)->concat($instagram)->sortBy(function () {
            return rand(1, 1000);
            })->take(12) as $item)
            <div class="w-full md:w-1/2 lg:w-1/3 p-2">
                @include('_partials.social-preview', ['item' => $item])
            </div>
            @endforeach
        </div>
    </div>
</div>

{{-- Blog --}}
<div class="container px-6 pt-10 mx-auto">
    @foreach ($posts->where('featured', false)->reject(function ($post) {
    return $post->hidden ?? false;
    })->take(4)->chunk(2) as $row)
    <div class="flex flex-col md:flex-row md:-mx-6">
        @foreach ($row as $post)
        <div class="w-full md:w-1/2 md:mx-6">
            @include('_components.post-preview-inline')
        </div>

        @endforeach
    </div>
    @endforeach

    <div class="pt-12 text-center">
        <a href="/blog/" class="button button-secondary button-large">More Posts</a>
    </div>
</div>
@stop
