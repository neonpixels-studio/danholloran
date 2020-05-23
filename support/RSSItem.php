<?php

namespace App\Support;

use Illuminate\Support\Str;

class RSSItem
{
    protected $frontmatter;
    protected $title;
    protected $body;

    public function __construct(string $title, string $body, array $frontmatter, string $collectionName)
    {
        $this->title = $title;
        $this->body = $body;
        $this->collectionName = $collectionName;
        $this->frontmatter = collect($frontmatter)->recursive()
            ->put('title', $title)
            ->put('collectionName', $collectionName)
            ->put('slug', Str::slug($this->title));
    }

    public function title()
    {
        return $this->title;
    }

    public function slug()
    {
        return Str::slug($this->title);
    }

    public function body()
    {
        return $this->body;
    }

    public function frontmatter()
    {
        return $this->frontmatter;
    }

    public function collectionName()
    {
        return $this->collectionName;
    }

    public function toArray()
    {
        return [
            'frontmatter' => $this->frontmatter(),
            'collectionName' => $this->collectionName(),
            'body' => $this->body(),
        ];
    }
}
