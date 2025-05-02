---
title:  "Control time in your tests"
excerpt:
categories: java
author: hinse
---

Now and then we need to write some code which is time-sensitive.
The output depends on a specific date or the time of day.
The production code within a Quarkus application is not that hard to write.
Just use `LocalTime.now()`, and use some logic to make a decision.

So the production code is straightforward, but writing a reliable unit test for this kind of code might be less trivial.

{% include admonition.html type="note" title="NOTE" body="While the code in this example is using Quarkus, the same principles will apply when using Spring." %}

## Greeting Example
Let's illustrate this with a simple example in Quarkus.
Imagine a greeting service that needs to return a different message based on the time of day. Here's a basic implementation:

```java
@ApplicationScoped
public class GreetingService {
    public String getGreeting() {
        var currentTime = LocalTime.now();
        if (currentTime.isBefore(LocalTime.of(12, 0))) {
            return "Good morning";
        } else if (currentTime.isBefore(LocalTime.of(18, 0))) {
            return "Good afternoon";
        } else {
            return "Good evening";
        }
    }
}
```

Now, how would we write a Quarkus Unit test to ensure this service behaves correctly for different times of the day?
A naive approach might involve simply calling the `getGreeting()` method and asserting the output.

```java
@QuarkusTest
public class GreetingServiceTest {
    @Inject
    GreetingService greetingService;

    @Test
    void testGreeting() {
        assertEquals("Good morning", greetingService.getGreeting());
    }
}
```

However, this immediately presents a challenge: the test's outcome becomes dependent on the actual time at which it is executed.
The test succeeds when ran in the morning but fails at other times of the day.

## Use the clock
Luckily Java already has an abstraction that could help with this: `java.time.Clock`.
All the relevant date/time related classes in the `java.time` package which have a `now()` method also have a method which accepts a `Clock` instance: `now(clock)`.
So for our example we could use `LocalTime.now(clock)`.

The only thing remaining is injecting the proper `Clock` instance:
- For the production code, we would use `Clock.systemDefaultZone()` or `Clock.systemUTC()` for example.
- For testing purposes we would inject a clock with a predefined time, for example: `Clock.fixed(instant, ZoneOffset.UTC)`

To use the `Clock`, we could have a `Clock` instance injected into the `GreetingService` and use that injected clock to determine _now_, like:
```java
@ApplicationScoped
public class GreetingService {
    @Inject
    Clock clock;

    public String getGreeting() {
        var currentTime = LocalTime.now(clock);
        //... the rest of the code
    }
}
```

### Connect the wires - production code
For our production code, we would need a `Clock` bean which should represent the system time.
At the time of writing Quarkus doesn't provide such a bean out of the box, so we would need to provide one ourselves.
Luckily, it's straightforward to provide such a bean representing the system time:

```java
@Produces
@ApplicationScoped
Clock clock() {
    return Clock.systemDefaultZone();
}
```

### Connect the wires - test code
Now for the specific test where we would like to test the GreetingService we can inject a custom clock, just for that test.

```java
@Test
void testGreeting() {
    var fixedClock = Clock.fixed(Instant.parse("2024-04-30T08:30:12Z"), ZoneOffset.UTC);
    QuarkusMock.installMockForType(fixedClock, Clock.class);
    assertEquals("Good morning", greetingService.getGreeting());
}
```

and if we want to test how the service would respond in the afternoon, we could just inject another clock instance:

```java
@Test
void testAfternoonGreeting() {
    var fixedClock = Clock.fixed(Instant.parse("2024-04-30T14:45:00Z"), ZoneOffset.UTC);
    QuarkusMock.installMockForType(fixedClock, Clock.class);
    assertEquals("Good afternoon", greetingService.getGreeting());
}
```

## More control
For some tests, the more integration test style, there could be the need for more control.
So instead of a fixed clock, there might be the need for an adjustable clock.

For example when you have a `TokenService` which can provide tokens which have a limited lifetime, like:
```java
public class TokenService {

    @Inject
    Clock clock;

    public String generateToken() {
        // token generation logic, using clock for expiration
    }

    public boolean isValidToken(String token) {
        Instant expirationInstant = getExpirationOf(token);
        if (expirationInstant.isBefore(clock.instant())) {
            return false;
        } else {
            return true;
        }
    }
    // some more helper code...
}
```

If you would like to test this service, you definitely don't want to use `Thread.sleep()` statements to wait for the token to expire.
It would be way better if you could simply advance the time while still staying in control of the exact timing.
So a test could ideally look something like this:

```java
@QuarkusTest
class TokenServiceTest {
    @Inject
    TokenService tokenService;

    @Test
    void testTokenShouldBeInvalidAfter3Minutes() {
        var instant = Instant.parse("2024-04-30T15:21:12Z");
        var testClock = TestClock.at(instant, ZoneOffset.UTC);
        QuarkusMock.installMockForType(testClock, Clock.class);

        var token = tokenService.generateToken();
        // Initially token is valid
        assertTrue(tokenService.isValidToken(token));

        testClock.advance(Duration.ofMinutes(3));
        // After 3 minutes the token should not be valid anymore
        assertFalse(tokenService.isValidToken(token));
    }
}
```

This could be achieved by creating a simple and re-usable `TestClock` implementation.
This implementation would mostly be delegating to fixed clock.

```java
/**
 * Mutable clock for testing purposes
 */
public class TestClock extends Clock {
    private Clock delegate;

    private TestClock(Clock delegate) {
        this.delegate = delegate;
    }

    @Override
    public ZoneId getZone() {
        return delegate.getZone();
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return new TestClock(delegate.withZone(zone));
    }

    @Override
    public Instant instant() {
        return delegate.instant();
    }

    public void advance(Duration offset) {
        delegate = Clock.offset(delegate, offset);
    }

    public static TestClock at(Instant instant) {
        return at(instant, ZoneOffset.UTC);
    }

    public static TestClock at(Instant instant, ZoneId zoneId) {
        return new TestClock(Clock.fixed(instant, zoneId));
    }
}
```

## Conclusion
Using `Clock` in all your calls to the `.now(clock)` will give you a lot of control over the time that your application observes.
Make sure to provide a default `Clock` bean, such that your production code and most of your tests can run normally.
In tests where you really need control over the `Clock`, you can provide a _fixed_ `Clock` or even a `TestClock` bean.

