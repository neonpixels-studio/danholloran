@extends('_layouts.master')

@section('body')
<div class="pb-8 bg-gray-200">
    <div class="container flex justify-end max-w-6xl px-8 py-4 mx-auto -mt-8 print-hidden">
        <a href="{{ $page->resumeUrl }}" class="inline-flex button button-primary" target="_blank"
            rel="noopener noreferrer">
            Download
            <span class="h-5 ml-2">
                @include('_partials.icon-download-outline')
            </span>
        </a>
    </div>
    <div class="container flex max-w-6xl mx-auto bg-white resume">
        <div class="w-1/3 px-8 py-12 bg-gray-100">
            <div class="mb-8">
                <h1 class="mb-1 text-2xl leading-none">Dan Holloran</h1>
                <h2 class="mt-0 mb-0 text-lg leading-none text-primary-500">Full Stack Developer</h2>
            </div>
            <div class="mb-8">
                <h3 class="mt-0 mb-1 text-lg font-semibold leading-none text-gray-700">Contact Information</h3>
                <ul class="my-0">
                    <li class="flex items-center">
                        <span class="block w-4 h-4 mr-2 text-gray-500">@include('_partials.icon-mail')</span>
                        <span class="sr-only">Email:</span>
                        dtholloran@gmail.com
                    </li>
                    <li class="flex items-center">
                        <span class="block w-4 h-4 mr-2 text-gray-500">@include('_partials.icon-phone')</span> <span
                            class="sr-only">Phone:</span> 314-882-8326
                    </li>
                    <li class="flex items-center leading-none">
                        <span class="block w-4 h-4 mr-2 text-gray-500">@include('_partials.icon-link')</span>
                        <span class="sr-only">Website:</span>
                        <a href="https://danholloran.me/">https://danholloran.me/</a>
                    </li>
                </ul>
            </div>
            <div class="mb-8 skills-tools">
                <h3 class="mt-0 mb-1 text-lg font-semibold leading-none text-gray-700">Skills &amp; Tools
                </h3>
                <ul class="flex flex-wrap -mx-1">
                    @foreach ($skills->reject(function($item) {
                    return (bool) $item->draft ?? false;
                    }) as $item)
                    <li
                        class="inline-flex px-3 pt-px mb-2 mr-2 text-xs font-semibold leading-loose tracking-wide text-gray-800 bg-gray-300 rounded">
                        {{ $item->title }}
                        @if(!$loop->last)
                        <span class="print-display">, </span>
                        @endif
                    </li>
                    @endforeach
                </ul>
            </div>
        </div>

        <div class="w-2/3 px-8 py-12">
            <div class="pb-4 mb-8 border-b-2 experience">
                <h2 class="mb-6 text-2xl leading-none text-gray-700">Experience</h2>
                @foreach ($experience->whereNotIn('category', ['education'])->reject(function($item) {
                return (bool) $item->draft ?? false;
                }) as $item)
                <div class="mb-4">
                    <div class="experience-header">
                        <div class="experience-company-title">
                            <h3 class="mb-1 text-xl experience-title">{{ $item->title }}</h3>

                            <h4 class="mt-0 mb-0 text-lg text-primary-500 experience-company">
                                <a href="{{ $item->company_url }}" target="_blank"
                                    rel="noopener noreferrer">{{ $item->company }}</a>
                            </h4>
                        </div>

                        <span class="text-gray-700 experience-span">{{ $item->start }} - {{ $item->end }}</span>
                    </div>
                    <div>
                        {!! $item->getContent() !!}
                    </div>
                </div>
                @endforeach
            </div>
            <div class="pb-4 mb-8 border-b-2 education">
                <h2 class="mb-6 text-2xl leading-none text-gray-700">Education</h2>
                @foreach ($experience->whereIn('category', 'education')->reject(function($item) {
                return (bool) $item->draft ?? false;
                }) as $item)
                <div class="mb-4">
                    <h3 class="mb-1 text-xl education-title">{{ $item->title }}</h3>
                    <h4 class="mt-0 mb-0 text-lg text-primary-500 education-school">
                        <a href="{{ $item->company_url }}" target="_blank"
                            rel="noopener noreferrer">{{ $item->company }}</a>
                    </h4>
                    <span class="text-gray-700">{{ $item->start }} - {{ $item->end }}</span>
                </div>
                @endforeach
            </div>
        </div>
    </div>
</div>
@stop
