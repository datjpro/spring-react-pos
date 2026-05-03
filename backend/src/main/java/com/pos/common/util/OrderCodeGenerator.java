package com.pos.common.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class OrderCodeGenerator {

    private OrderCodeGenerator() {
    }

    public static String generate(int sequence) {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return "ORD-" + datePart + "-" + String.format("%03d", sequence);
    }
}
