package com.pos.common.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

public final class OrderCodeGenerator {

    private OrderCodeGenerator() {
    }

    public static String generate(int sequence) {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return "ORD-" + datePart + "-" + String.format("%03d", sequence);
    }

    public static String generate() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        int randomPart = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return "ORD-" + datePart + "-" + randomPart;
    }
}
