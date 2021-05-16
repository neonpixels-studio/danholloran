@extends('_layouts.master')

@php
$width = 1280;
$height = 640;
@endphp

@section('body')
<logo-editor>
    <template slot="logo">
        @include('_partials.logo', ['widthClass' => 'w-full'])
    </template>
</logo-editor>
@endsection
