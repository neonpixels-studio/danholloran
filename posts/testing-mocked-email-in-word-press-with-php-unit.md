---
extends: _layouts.post
section: content
title:  Testing mocked email in WordPress with PHPUnit
date: 2018-12-15
categories: []
published: true
---

<div class="alert alert-info">
    <p>Before we get started this post assumes the following.</p>
    <ul>
        <li>
            You have some understanding of PHPUnit and using it with WordPress
        </li>
        <li>
            You are scaffolding your tests via <a href="https://developer.wordpress.org/cli/commands/scaffold/plugin-tests/"><code>wp scaffold plugin-tests</code></a>
        </li>
    </ul>
</div>

This is a quick tip about mocking e-mails when testing WordPress with PHPUnit. There's a [`MockPHPMailer`](https://core.trac.wordpress.org/browser/trunk/tests/phpunit/includes/mock-mailer.php) that replaces the default PHPMailer implementation used to send e-mails in WordPress. You can get access to the emails that have sent out via your tests. You can access the mailer via `global $phpmailer` and the emails with `$phpmailer->mock_sent`.

Below is an example of using this in your tests. It assumes one email sent for simplicity this may work for simple situations. This could break your test if there are multiple emails sent if the order changes.

```php
/** @test */
public function it_sends_a_new_order_notification_when_a_new_order_is_created()
{
    global $phpmailer;

    $user = $this->createUser();

    (new Order)->forUser($user)->createFromCart();

    $this->assertNotNull($phpmailer->mock_sent[0]);
    $mail = $phpmailer->mock_sent[0];
    $this->assertEquals('john@example.com', $mail['to'][0][0]);
    $this->assertContains('Thank you for your order', $mail['subject']);
    $this->assertContains('Order details', $mail['body']);
}
```
