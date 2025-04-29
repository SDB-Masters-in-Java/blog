---
title: Reduce unnecessary "ceremony" with the map method 
excerpt: 
  The `map` function on Streams and Optionals is a concise way to transform the items they contain, without worrying about the mechanics of the "container" type.
tags:
- java
- functional
toc: true
author: hinse
---

> Originally published on my personal blog at [coduinix.com](https://coduinix.com) on Jul 24, 2023. Minor edits for clarity.

Recently I was pair-programming with a co-worker struggling with understanding the `map` function of `java.util.stream.Stream`.
The brought back memories of how I learned the meaning and practical application of the `map` function.

## Lists
Let's have a look at good-old Lists first

### In the very old days (pre Java 5)
In the Java 1.2+ days we had lists without generics, no streams API and no for-each loops.

Suppose we have a `List` of String containing words (`words`) and we want to convert it to a list containing the lengths of the words.
In these early versions of Java the following had to be done:
```java
public static List getWordLengths(List words) {
    List result = new ArrayList();
    for (int i = 0; i < words.size(); i++) {
        String word = (String) words.get(i);
        result.add(word.length());
    }
    return result;
}
```

or... if you wanted to abstract away from using an integer index and checking the size, you could use an iterator.
```java
public static List getWordLengths(List words) {
    List result = new ArrayList();
    Iterator iterator = words.iterator();
    while (iterator.hasNext()) {
        String word = (String) iterator.next();
        result.add(word.length());
    }
    return result;
}
```

The nice thing about the second version is that it required a bit less knowledge about the list.
You didn't need consider the size of the list.

At that moment in time, every Java programmer would almost immediately recognize what the code was supposed to do:
"_transform every item of the list of `words` into the length of the word_"

There was just a large portion of _ceremony_ around the actual transformation.

### In the less-old days (pre Java 8)
With Java 5, the required _ceremony_ for doing these kinds of transformations was greatly reduced.

Instead of using `Iterator` or index variables we could use the for-each loop construct.
And in addition we got generics, which made the casts obsolete (when the `words` list was defined as `List<String>`)

So in order to do the same as before, we would now only need this code (since the `words` was now of typed with generics )
```java
public static List<Integer> getWordLengths(List<String> words) {
    List<Integer> result = new ArrayList<Integer>();
    for (String word : words) {
        result.add(word.length());
    }
    return result;
}
```

The great benefit was that we nearly didn't have to think about "how to iterate" over all the items.
We could just focus on the transformation and add the results to a list.

And again... somewhat experienced Java programmers would immediately see what was going on.
Every item of the list was being transformed and put into the result list.
We just didn't have a proper name for "transform every item and put into result list".

### Recent days
With Java 8 we got the Streams API and lambdas.
This Streams API introduced the concept of "transform every item" by adding the `map` method.

```java
public static List<Integer> getWordLengths(List<String> words) {
    return words.stream()
            .map(word -> word.length())
            .collect(Collectors.toList());
}
```

This map basically says: transform every item and collect the results in a new list.
The only "unnecessary" ceremony is the `.stream()` and the `.collect(Collectors.toList())`.

### Current day
With the helper methods introduced in Java 16, it's even more convenient since the `.collect(...)` could be replaced with `toList` in order to reduce some of the "unnecessary" ceremony.

```java
public static List<Integer> getWordLengths(List<String> words) {
    return words.stream()
            .map(word -> word.length())
            .toList();
}
```

So with this version we don't need to think about iterating and creating new collections anymore.
We could just focus on the transformation.
We just _map_ every item that is _contained_ in the list.

## Optional
In addition to collections/streams, there is another part of the standard Java APIs where we can use `map` to prevent unnecessary ceremony... `Optional`

Suppose we have a variable that might or might not contain a word:
```java
Optional<String> maybeWord = ...
```

### With boilerplate
Suppose we want to get the length of the word, if there is a word in it.
A "naive" approach could be to check whether the optional _contains_ a word, and if so... transform the item.
E.g., something like this:

```java
if (maybeWord.isPresent()) {
    return Optional.of(maybeWord.get().length());
} else {
    return Optional.empty();
}
```
What we basically want to do is transform every item (0 or 1 item) to its length.
We use some ceremony to determine the content of the `Optional` and to create a new `Optional` containing the result.

### Without boilerplate
This sounds quite similar to the `.map` function we saw earlier.
We don't want to mess around we destructuring and assembling some results ourselves, we'd like the `map` function to take care of that.

Luckily the creators of Java created an equivalent `map` function on the `Optional` class, making it a breeze to transform data contained in an Optional.

```java
return maybeWord.map(word -> word.length());
```

## Keep in mind
It is important to keep in mind that the function/lambda, which does the mapping, shouldn't modify the original object nor the original list that the stream is created for.
Ideally, the function should be side-effect-free.

## Other appearances
The `map` function is something which could be found in all kinds of APIs and other programming languages too.

For example, when doing reactive programming with Spring WebFlux you could use the `map` function to transform a `Mono`.
Or when using Quarkus you could call `map` on a `Uni` to get a transformed `Uni`.