package com.example.lissomsoft.tms.audit;

import java.lang.reflect.Method;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public final class ActivityDiffUtil {

    private ActivityDiffUtil() {
    }


    public static Map<String, Object> snapshot(Object entity) {
        Map<String, Object> values = new LinkedHashMap<>();
        if (entity == null) {
            return values;
        }
        for (Method method : entity.getClass().getMethods()) {
            if (method.getParameterCount() != 0 || method.getReturnType() == void.class) {
                continue;
            }
            String field = fieldNameOf(method);
            if (field == null || isSecret(field)) {
                continue;
            }
            try {
                values.put(field, method.invoke(entity));
            } catch (ReflectiveOperationException | IllegalArgumentException ignored) {
                // Skip getters that can't be read (e.g. lazy proxies) rather than fail the request over an audit line.
            }
        }
        return values;
    }

    public static String diff(Map<String, Object> before, Object after) {
        Map<String, Object> afterValues = snapshot(after);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : afterValues.entrySet()) {
            Object oldValue = before.get(entry.getKey());
            Object newValue = entry.getValue();
            if (Objects.equals(oldValue, newValue)) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append("Old - ").append(entry.getKey()).append(": ").append(display(oldValue))
              .append(" new - ").append(entry.getKey()).append(": ").append(display(newValue));
        }
        return sb.toString();
    }

    private static boolean isSecret(String field) {
        return field.toLowerCase().contains("password");
    }

    private static String display(Object value) {
        return value == null ? "" : value.toString();
    }

    private static String fieldNameOf(Method method) {
        String name = method.getName();
        if (name.equals("getClass")) {
            return null;
        }
        if (name.length() > 3 && name.startsWith("get")) {
            return decapitalize(name.substring(3));
        }
        if (name.length() > 2 && name.startsWith("is")) {
            return decapitalize(name.substring(2));
        }
        return null;
    }

    private static String decapitalize(String s) {
        return Character.toLowerCase(s.charAt(0)) + s.substring(1);
    }
}
