<?php

namespace App\Listeners;

use Zttp\ZttpResponse;
use App\Support\RSSItem;
use App\Support\RSSGenerator;
use Illuminate\Support\Collection;

class GenerateInstagram extends RSSGenerator
{
    protected function formatItem(Collection $item, string $group): RSSItem
    {
        return new RSSItem(
            $item->get('title'),
            $item->get('description'),
            [
                'link' => $item->get('link'),
                'date' => $item->get('pubDate'),
                'guid' => $item->get('guid'),
            ]
        );
    }

    protected function collectionName(): string
    {
        return 'instagram';
    }

    protected function getServiceUrl(string $group): string
    {
        return 'http://fetchrss.com/rss/5ec916af8a93f8a9418b45685ec92cf08a93f88c2e8b4567.xml';
    }
}
