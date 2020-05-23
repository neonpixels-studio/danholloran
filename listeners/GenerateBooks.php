<?php

namespace App\Listeners;

use Zttp\ZttpResponse;
use App\Support\RSSItem;
use Illuminate\Support\Str;
use App\Support\RSSGenerator;
use Illuminate\Support\Collection;

class GenerateBooks extends RSSGenerator
{
    protected function groups(): Collection
    {
        return collect([
            'currently-reading',
            'read',
        ]);
    }

    protected function formatItem(Collection $item, string $group): RSSItem
    {
        return new RSSItem(
            $item->get('title'),
            $item->get('book_description'),
            [
                'author_name' => $item->get('author_name'),
                'link' => $item->get('link'),
                'image_url' => $item->get('book_image_url'),
                'small_image_url' => $item->get('book_small_image_url'),
                'medium_image_url' => $item->get('book_medium_image_url'),
                'large_image_url' => $item->get('book_large_image_url'),
                'slug' => Str::slug($item->get('title')),
                'date' => $item->get('pubDate'),
                'group' => $group,
            ],
            $this->collectionName()
        );
    }

    protected function collectionName(): string
    {
        return 'books';
    }

    protected function getServiceUrl(string $group): string
    {
        $key = 'REDACTED';
        return "https://www.goodreads.com/review/list_rss/51747901?key={$key}&shelf={$group}";
    }
}
