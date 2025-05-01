---
title:  "Control time in Quarkus Tests"
excerpt:
categories:
 - java
 - quarkus
author: hinse
---

Now and then we need to write some code which is time-sensitive. 
The output depends on a specific date or the time of day.
The production code within a Quarkus application is not that hard to write.
Just use `LocalTime.now()`, and use some logic to make a decision.

So the production code is straightforward, but writing a reliable unit test for this kind of code might be less trivial.

### Simple example
Let's illustrate this with a simple example in Quarkus. 
Imagine a greeting service that needs to return a different message based on the time of day. Here's a basic implementation:

```java
@ApplicationScoped
public class GreetingService {
    public String getGreeting() {
        LocalTime currentTime = LocalTime.now();
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
