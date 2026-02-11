<?php

namespace Tests\Unit;

use App\Support\MailDispatch;
use Tests\TestCase;

class MailDispatchTest extends TestCase
{
    public function test_backoff_parsing_ignores_invalid_values_and_duplicates(): void
    {
        config()->set('ops.mail.backoff_seconds', '10, invalid, 30,10,,5');

        $this->assertSame([10, 30, 5], MailDispatch::backoffSeconds());
    }

    public function test_backoff_falls_back_to_defaults_when_no_valid_values_are_provided(): void
    {
        config()->set('ops.mail.backoff_seconds', 'foo,bar,-1');

        $this->assertSame([60, 300, 900], MailDispatch::backoffSeconds());
    }

    public function test_queue_defaults_and_async_flag_are_read_from_config(): void
    {
        config()->set('ops.mail.async_enabled', true);
        config()->set('ops.mail.queue', 'emails');
        config()->set('ops.mail.queue_connection', 'database');
        config()->set('ops.mail.tries', 5);

        $this->assertTrue(MailDispatch::asyncEnabled());
        $this->assertSame('emails', MailDispatch::queueName());
        $this->assertSame('database', MailDispatch::queueConnection());
        $this->assertSame(5, MailDispatch::tries());
    }
}
